import pg from "pg";
import { readFileSync } from "node:fs";

const mode = process.argv[2] ?? "inspect";
if (!["inspect", "apply"].includes(mode)) throw Error("Use inspect ou apply.");

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) throw Error("Configure SUPABASE_DATABASE_URL localmente.");

const requiredTables = [
  "about",
  "music",
  "events",
  "admin_users",
  "admin_sessions",
  "login_attempts",
];

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 15000 });
try {
  await client.connect();
  const existing = (
    await client.query(
      `select table_name from information_schema.tables
       where table_schema='public' and table_name=any($1) order by table_name`,
      [requiredTables],
    )
  ).rows.map((row) => row.table_name);

  if (mode === "inspect") {
    console.log(JSON.stringify({ mode, existingAppTables: existing }, null, 2));
  } else {
    if (existing.length) {
      throw Error(
        `O destino já contém tabelas da aplicação (${existing.join(", ")}); a migration não foi reaplicada.`,
      );
    }
    const sql = readFileSync(
      new URL("../supabase/migrations/202609040001_initial.sql", import.meta.url),
      "utf8",
    );
    await client.query(sql);
    const created = (
      await client.query(
        `select table_name from information_schema.tables
         where table_schema='public' and table_name=any($1) order by table_name`,
        [requiredTables],
      )
    ).rows.map((row) => row.table_name);
    const rls = (
      await client.query(
        `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
         where n.nspname='public' and c.relname=any($1) and c.relrowsecurity order by relname`,
        [requiredTables],
      )
    ).rows.map((row) => row.relname);
    if (created.length !== requiredTables.length || rls.length !== requiredTables.length) {
      throw Error("A conferência do esquema criado falhou.");
    }
    console.log(JSON.stringify({ mode, createdTables: created, rlsEnabled: rls }, null, 2));
  }
} finally {
  await client.end().catch(() => {});
}
