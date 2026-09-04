import pg from "pg";
import { readFileSync } from "node:fs";
const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) throw Error("SUPABASE_DATABASE_URL ausente.");
const db = new pg.Client({ connectionString, connectionTimeoutMillis: 15000 });
try {
  await db.connect();
  const definition = (
    await db.query(
      `select pg_get_functiondef('public.add_music(text,text,text,text)'::regprocedure) as value`,
    )
  ).rows[0].value;
  if (!definition.includes("where id is not null")) {
    const sql = readFileSync(
      new URL("../supabase/migrations/202609040002_safe_music_update.sql", import.meta.url),
      "utf8",
    );
    await db.query(sql);
  }
  const verified = (
    await db.query(
      `select pg_get_functiondef('public.add_music(text,text,text,text)'::regprocedure) as value`,
    )
  ).rows[0].value.includes("where id is not null");
  if (!verified) throw Error("A função não foi atualizada.");
  console.log(JSON.stringify({ result: "verified", migration: "202609040002" }));
} finally {
  await db.end().catch(() => {});
}
