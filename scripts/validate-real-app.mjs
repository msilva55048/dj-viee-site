import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;
if (!databaseUrl) throw Error("SUPABASE_DATABASE_URL ausente.");
const port = 3217;
const origin = `http://localhost:${port}`;
const marker = `CODEX_MIGRATION_TEST_${Date.now()}_${randomBytes(4).toString("hex")}`;
const password = randomBytes(24).toString("base64url");
const db = new pg.Client({ connectionString: databaseUrl });
let server;
let testAdminId;
let testMusicId;
let testEventId;

const appTables = ["about", "music", "events", "admin_users"];
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function state() {
  const result = {};
  for (const table of appTables) {
    result[table] = (
      await db.query(`select to_jsonb(t)::text as row from public.${table} t order by id`)
    ).rows.map((row) => row.row);
  }
  return digest(result);
}
async function waitForApp() {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(origin + "/login");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw Error("A aplicação local não iniciou a tempo.");
}

await db.connect();
const baseline = await state();
const cookies = new Map();
async function request(path, init = {}) {
  const response = await fetch(origin + path, {
    ...init,
    redirect: "manual",
    headers: {
      cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
      ...init.headers,
    },
  });
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const split = pair.indexOf("=");
    cookies.set(pair.slice(0, split), pair.slice(split + 1));
  }
  return response;
}
const csrf = () => cookies.get("__Host-djviee-csrf");
const post = (path, fields) =>
  request(path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin },
    body: new URLSearchParams({ _csrf: csrf(), ...fields }),
  });
const redirect = (response, location) => {
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), location);
};

try {
  const createdAdmin = await db.query(
    `insert into public.admin_users(username,password,created_at,updated_at)
     values($1,$2,localtimestamp,localtimestamp) returning id::text`,
    [marker, await bcrypt.hash(password, 10)],
  );
  testAdminId = createdAdmin.rows[0].id;
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, SITE_URL: origin },
    stdio: "ignore",
  });
  await waitForApp();

  assert.equal((await request("/admin")).status, 307);
  assert.equal(
    (
      await request("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
  );
  const homeBefore = await (await request("/")).text();
  assert.equal((homeBefore.match(/class="track"/g) ?? []).length, 6);

  await request("/login");
  redirect(await post("/login", { username: marker, password }), "/admin");
  assert.equal((await request("/admin")).status, 200);

  redirect(
    await post("/admin/musicas", {
      title: marker,
      artists: marker,
      youtubeUrl: "https://youtu.be/abcdefghijk",
    }),
    "/admin/musicas?message=music_added",
  );
  const music = await db.query(
    "select id::text,position from public.music where title=$1 and artists=$1",
    [marker],
  );
  assert.equal(music.rowCount, 1);
  testMusicId = music.rows[0].id;
  assert.equal(music.rows[0].position, 1);
  const homeWithMusic = await (await request("/")).text();
  assert.equal((homeWithMusic.match(/class="track"/g) ?? []).length, 6);
  assert.ok(homeWithMusic.includes(marker));
  redirect(
    await post("/admin/musicas/excluir", { id: testMusicId }),
    "/admin/musicas?message=music_deleted",
  );
  testMusicId = undefined;

  redirect(
    await post("/admin/eventos", {
      title: marker,
      eventDate: "2030-01-02",
      city: "TESTE MIGRACAO",
      location: "TESTE MIGRACAO",
      description: marker,
    }),
    "/admin/eventos?message=event_added",
  );
  let event = await db.query("select id::text from public.events where title=$1", [marker]);
  assert.equal(event.rowCount, 1);
  testEventId = event.rows[0].id;
  redirect(
    await post("/admin/eventos/editar", {
      id: testEventId,
      title: marker + "_EDITADO",
      eventDate: "2030-01-03",
      city: "TESTE MIGRACAO",
      location: "TESTE MIGRACAO",
      description: marker,
    }),
    "/admin/eventos?message=event_updated",
  );
  event = await db.query("select title,event_date::text from public.events where id=$1", [testEventId]);
  assert.equal(event.rows[0].title, marker + "_EDITADO");
  assert.equal(event.rows[0].event_date, "2030-01-03");
  redirect(
    await post("/admin/eventos/excluir", { id: testEventId }),
    "/admin/eventos?message=event_deleted",
  );
  testEventId = undefined;
  console.log(
    JSON.stringify({
      result: "verified",
      publicSiteRealData: true,
      unauthenticatedAdminBlocked: true,
      adminLogin: true,
      musicCreateFirstFeaturedSixDelete: true,
      eventCreateEditDelete: true,
    }),
  );
} finally {
  if (server) {
    server.kill();
    await new Promise((resolve) => server.once("exit", resolve));
  }
  if (testMusicId) await db.query("select public.delete_music($1)", [testMusicId]).catch(() => {});
  if (testEventId) await db.query("delete from public.events where id=$1", [testEventId]).catch(() => {});
  if (testAdminId) await db.query("delete from public.admin_users where id=$1", [testAdminId]).catch(() => {});
  const restored = await state();
  await db.end();
  if (restored !== baseline) throw Error("O estado dos dados reais não foi restaurado após o teste.");
}
