import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL migration, six featured songs, CRUD, private tables, RPC grants and RLS", async () => {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;",
  );
  await db.exec(
    readFileSync("supabase/migrations/202609040001_initial.sql", "utf8"),
  );
  try {
    const rls = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname=any($1)",
      [
        [
          "about",
          "music",
          "events",
          "admin_users",
          "admin_sessions",
          "login_attempts",
        ],
      ],
    );
    assert.equal(rls.rows.length, 6);
    assert.ok(rls.rows.every((r) => r.relrowsecurity));
    await db.exec("set role service_role");
    for (let i = 1; i <= 8; i++)
      await db.query(
        "select public.add_music($1,'TEST ONLY','https://youtu.be/abcdefghijk','abcdefghijk')",
        ["TEST ONLY " + i],
      );
    let music = await db.query<{ title: string; position: number }>(
      "select title,position from public.music order by position",
    );
    assert.equal(music.rows.length, 8);
    assert.equal(music.rows[0].title, "TEST ONLY 8");
    assert.deepEqual(
      music.rows.map((r) => r.position),
      [1, 2, 3, 4, 5, 6, 7, 8],
    );
    await db.query("select public.save_about('p1','p2','p3')");
    await db.query("select public.save_about('changed','p2','p3')");
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from public.about",
        )
      ).rows[0].n,
      1,
    );
    await db.exec(
      "insert into public.events(title,event_date,ticket_url) values ('TEST ONLY','2026-09-04','https://example.com/ticket'); update public.events set city='Changed' where id=1;",
    );
    await db.exec("reset role; set role anon");
    const visible = await db.query<{ title: string }>(
      "select title from public.featured_music order by position",
    );
    assert.deepEqual(
      visible.rows.map((r) => r.title),
      [
        "TEST ONLY 8",
        "TEST ONLY 7",
        "TEST ONLY 6",
        "TEST ONLY 5",
        "TEST ONLY 4",
        "TEST ONLY 3",
      ],
    );
    assert.equal(
      (await db.query<{ city: string }>("select city from public.events"))
        .rows[0].city,
      "Changed",
    );
    assert.equal(
      (
        await db.query<{ paragraph_1: string }>(
          "select paragraph_1 from public.about",
        )
      ).rows[0].paragraph_1,
      "changed",
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec("reset role; set role " + role);
      for (const table of [
        "admin_users",
        "admin_sessions",
        "login_attempts",
        "music",
      ])
        await assert.rejects(() => db.query(`select * from public.${table}`));
      for (const table of ["music", "about", "events", "admin_users"]) {
        await assert.rejects(() => db.query(`delete from public.${table}`));
        await assert.rejects(() =>
          db.query(`update public.${table} set id=id`),
        );
        await assert.rejects(() =>
          db.query(`insert into public.${table}(id) values (999)`),
        );
      }
      await assert.rejects(() =>
        db.query("select public.add_music('x','x','x','x')"),
      );
      await assert.rejects(() => db.query("select public.delete_music(1)"));
      await assert.rejects(() =>
        db.query("select public.save_about('x','x','x')"),
      );
      await assert.rejects(() =>
        db.query("select public.consume_login_attempt('x')"),
      );
      await assert.rejects(() =>
        db.query("select public.change_admin_password(1,'x','y')"),
      );
    }
    await db.exec("reset role; set role service_role");
    await db.query("select public.delete_music(4)");
    music = await db.query(
      "select title,position from public.music order by position",
    );
    assert.deepEqual(
      music.rows.map((r) => r.position),
      [1, 2, 3, 4, 5, 6, 7],
    );
    await assert.rejects(() => db.query("select public.delete_music(999)"));
    const before = await db.query(
      "select * from public.music order by position",
    );
    await assert.rejects(() =>
      db.query("select public.add_music($1,'x','x','x')", ["x".repeat(181)]),
    );
    assert.deepEqual(
      (await db.query("select * from public.music order by position")).rows,
      before.rows,
      "failed insertion rolls back position shifts",
    );
    await db.exec("delete from public.events where id=1");
    assert.equal(
      (await db.query("select * from public.events")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});

test("Session revocation and persistent login throttling are atomic", async () => {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;",
  );
  await db.exec(
    readFileSync("supabase/migrations/202609040001_initial.sql", "utf8"),
  );
  try {
    await db.exec(
      "insert into public.admin_users(username,password,created_at,updated_at) values('TEST ONLY','old-hash',localtimestamp,localtimestamp); insert into public.admin_sessions(token_hash,admin_id,expires_at) values('test-token',1,now()+interval '1 hour')",
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.change_admin_password(1,'wrong','new-hash') ok",
        )
      ).rows[0].ok,
      false,
    );
    assert.equal(
      (await db.query("select * from public.admin_sessions")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.change_admin_password(1,'old-hash','new-hash') ok",
        )
      ).rows[0].ok,
      true,
    );
    assert.equal(
      (await db.query("select * from public.admin_sessions")).rows.length,
      0,
    );
    for (let i = 0; i < 10; i++)
      assert.equal(
        (
          await db.query<{ ok: boolean }>(
            "select public.consume_login_attempt('test') ok",
          )
        ).rows[0].ok,
        true,
      );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.consume_login_attempt('test') ok",
        )
      ).rows[0].ok,
      false,
    );
    await db.exec(
      "update public.login_attempts set window_start=now()-interval '16 minutes'",
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.consume_login_attempt('test') ok",
        )
      ).rows[0].ok,
      true,
    );
  } finally {
    await db.close();
  }
});
