// Isolated PostgREST-compatible test adapter backed by actual PostgreSQL/WASM.
// This file is never imported by production code and never connects to Supabase/Render.
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import { hash } from "bcryptjs";
import { defaultAbout } from "../src/lib/default-about";
const localDate = (value: Date) =>
  [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");

const identifier = (value: string) => {
  if (!/^[a-z_][a-z_0-9]*$/i.test(value)) throw Error("Invalid identifier");
  return '"' + value + '"';
};
export async function testStack(appPort = 3100) {
  const db = new PGlite();
  await db.exec(
    "create role anon;create role authenticated;create role service_role bypassrls;",
  );
  await db.exec(
    readFileSync("supabase/migrations/202609040001_initial.sql", "utf8"),
  );
  const secret = randomBytes(24).toString("hex"),
    publicKey = randomBytes(24).toString("hex"),
    password = randomBytes(18).toString("hex");
  await db.query(
    "insert into public.admin_users(username,password,created_at,updated_at) values($1,$2,localtimestamp,localtimestamp)",
    ["visual-test", await hash(password, 10)],
  );
  async function serve(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url!, "http://localhost");
    if (!url.pathname.startsWith("/rest/v1/")) {
      const root = url.pathname.startsWith("/__legacy/")
        ? "test-results/legacy"
        : "public";
      const path = resolve(root, "." + url.pathname.replace("/__legacy", ""));
      if (!path.startsWith(resolve(root)) || !existsSync(path)) {
        res.writeHead(404).end();
        return;
      }
      const mime: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
      };
      res.setHeader(
        "Content-Type",
        mime[extname(path)] ?? "application/octet-stream",
      );
      res.end(readFileSync(path));
      return;
    }
    const key = req.headers.apikey;
    if (key !== secret && key !== publicKey) {
      res.writeHead(401).end();
      return;
    }
    const parts: Buffer[] = [];
    for await (const chunk of req) parts.push(Buffer.from(chunk));
    const body = parts.length
      ? JSON.parse(Buffer.concat(parts).toString())
      : null;
    const segments = url.pathname.slice("/rest/v1/".length).split("/");
    try {
      const result = await db.transaction(async (tx) => {
        await tx.exec(
          "set local role " + (key === secret ? "service_role" : "anon"),
        );
        if (segments[0] === "rpc") {
          const args = Object.keys(body ?? {});
          return {
            rpc: true,
            data: (
              await tx.query(
                `select public.${identifier(segments[1])}(${args.map((a, i) => identifier(a) + " => $" + (i + 1)).join(",")}) as value`,
                args.map((a) => body[a]),
              )
            ).rows[0],
          };
        }
        const table = identifier(segments[0]);
        const params: unknown[] = [];
        const value = (v: unknown) => {
          params.push(v);
          return "$" + params.length;
        };
        const filters: string[] = [];
        for (const [name, filter] of url.searchParams) {
          if (["select", "order", "limit", "offset"].includes(name)) continue;
          const i = filter.indexOf("."),
            op = filter.slice(0, i),
            v = filter.slice(i + 1);
          const operator = (
            { eq: "=", gt: ">", lt: "<" } as Record<string, string>
          )[op];
          if (!operator) throw Error("Unknown filter");
          filters.push(identifier(name) + operator + value(v));
        }
        const where = filters.length ? " where " + filters.join(" and ") : "";
        const projection = (url.searchParams.get("select") ?? "*")
          .split(",")
          .map((p) => {
            if (p === "*") return "*";
            if (p.endsWith("::text"))
              return identifier(p.slice(0, -6)) + "::text";
            const parts = p.split(":");
            return parts.length === 2
              ? identifier(parts[1]) + " as " + identifier(parts[0])
              : identifier(p);
          })
          .join(",");
        let sql = "";
        if (req.method === "GET") {
          sql = `select ${projection} from public.${table}${where}`;
          const order = url.searchParams.get("order");
          if (order)
            sql +=
              " order by " +
              order
                .split(",")
                .map((o) => {
                  const [c, d] = o.split(".");
                  return identifier(c) + (d === "desc" ? " desc" : " asc");
                })
                .join(",");
          const limit = url.searchParams.get("limit");
          if (limit) sql += " limit " + value(Number(limit));
          const offset = url.searchParams.get("offset");
          if (offset) sql += " offset " + value(Number(offset));
        } else if (req.method === "POST") {
          const row = Array.isArray(body) ? body[0] : body;
          const names = Object.keys(row);
          sql = `insert into public.${table}(${names.map(identifier).join(",")}) values(${names.map((n) => value(row[n])).join(",")}) returning ${projection}`;
        } else if (req.method === "PATCH") {
          sql = `update public.${table} set ${Object.entries(body)
            .map(([k, v]) => identifier(k) + "=" + value(v))
            .join(",")}${where} returning ${projection}`;
        } else if (req.method === "DELETE")
          sql = `delete from public.${table}${where} returning ${projection}`;
        else throw Error("Unknown method");
        const rows = (await tx.query(sql, params)).rows as Record<
          string,
          unknown
        >[];
        for (const row of rows)
          for (const key of ["eventDate", "event_date"])
            if (row[key] instanceof Date)
              row[key] = (row[key] as Date).toISOString().slice(0, 10);
        for (const row of rows)
          for (const key of [
            "updatedAt",
            "updated_at",
            "createdAt",
            "created_at",
          ])
            if (row[key] instanceof Date) {
              const value = row[key] as Date;
              row[key] =
                localDate(value) +
                "T" +
                [value.getHours(), value.getMinutes(), value.getSeconds()]
                  .map((n) => String(n).padStart(2, "0"))
                  .join(":");
            }
        return { rpc: false, data: rows };
      });
      res.setHeader("Content-Type", "application/json");
      if (result.rpc)
        res.end(JSON.stringify((result.data as { value: unknown }).value));
      else {
        const rows = result.data as unknown[];
        if (req.headers.accept?.includes("application/vnd.pgrst.object+json")) {
          if (rows.length !== 1) {
            res.statusCode = 406;
            res.end(
              JSON.stringify({
                code: "PGRST116",
                details: `The result contains ${rows.length} rows`,
                message: "Cannot coerce the result to a single JSON object",
              }),
            );
          } else res.end(JSON.stringify(rows[0]));
        } else res.end(JSON.stringify(rows));
      }
    } catch (error) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({ code: "TEST_DB", message: (error as Error).message }),
      );
    }
  }
  const adapter = createServer((req, res) => {
    serve(req, res).catch(() => res.writeHead(500).end());
  });
  await new Promise<void>((r) => adapter.listen(0, "127.0.0.1", r));
  const address = adapter.address() as { port: number };
  const backend = `http://127.0.0.1:${address.port}`;
  const app = `http://localhost:${appPort}`;
  const next = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(appPort)],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
        SUPABASE_URL: backend,
        SUPABASE_PUBLISHABLE_KEY: publicKey,
        SUPABASE_SECRET_KEY: secret,
        SITE_URL: app,
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  let log = "";
  next.stdout?.on("data", (b) => {
    log += b;
  });
  next.stderr?.on("data", (b) => {
    log += b;
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(app + "/login")).ok) break;
    } catch {}
    if (next.exitCode !== null) throw Error("Next exited: " + log);
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    db,
    app,
    backend,
    password,
    secret,
    publicKey,
    log: () => log,
    async populate(populated: boolean) {
      await db.exec(
        "reset role;delete from public.music;delete from public.events;delete from public.about;",
      );
      if (populated) {
        await db.query(
          "insert into public.about(id,paragraph_1,paragraph_2,paragraph_3,updated_at) values(1,$1,$2,$3,$4)",
          [
            defaultAbout.paragraph1,
            defaultAbout.paragraph2,
            defaultAbout.paragraph3,
            "2026-09-04 12:30:00",
          ],
        );
        for (let i = 1; i <= 6; i++)
          await db.query(
            "insert into public.music(id,title,artists,youtube_url,youtube_video_id,position,created_at) values($1::bigint,$2,'TESTE AUTOMATIZADO','https://youtu.be/abcdefghijk','abcdefghijk',$1::integer,localtimestamp)",
            [i, "TESTE ISOLADO " + i],
          );
        await db.exec(
          "insert into public.events(id,title,event_date,location,city,description) values(1,'TESTE ISOLADO','2026-09-04','Local de teste','Cidade de teste','Descrição usada apenas na comparação automatizada.');select setval('music_id_seq',6);select setval('events_id_seq',1);select setval('about_id_seq',1);",
        );
      }
    },
    async close() {
      next.kill();
      await new Promise<void>((r) => adapter.close(() => r()));
      await db.close();
    },
  };
}
