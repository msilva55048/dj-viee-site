import pg from "pg";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const tables = ["about", "music", "events", "admin_users"];
const columns = {
  about: ["id", "paragraph_1", "paragraph_2", "paragraph_3", "updated_at"],
  music: [
    "id",
    "title",
    "artists",
    "youtube_url",
    "youtube_video_id",
    "position",
    "created_at",
  ],
  events: [
    "id",
    "title",
    "event_date",
    "city",
    "location",
    "description",
    "ticket_url",
  ],
  admin_users: ["id", "username", "password", "created_at", "updated_at"],
};
const quote = (value) => '"' + value.replaceAll('"', '""') + '"';
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function schema(client) {
  return (
    await client.query(
      `select table_name,column_name,data_type,udt_name,character_maximum_length,is_nullable,is_identity,column_default
    from information_schema.columns where table_schema='public' and table_name=any($1)
    order by table_name,ordinal_position`,
      [tables],
    )
  ).rows;
}
async function constraintsFor(client) {
  return (
    await client.query(
      `select cl.relname as table_name,c.conname,pg_get_constraintdef(c.oid) as definition
    from pg_constraint c join pg_class cl on cl.oid=c.conrelid join pg_namespace n on n.oid=cl.relnamespace
    where n.nspname='public' and cl.relname=any($1) order by cl.relname,c.conname`,
      [tables],
    )
  ).rows;
}
function assertColumns(metadata) {
  for (const table of tables) {
    const actual = metadata
      .filter((c) => c.table_name === table)
      .map((c) => c.column_name)
      .sort();
    if (JSON.stringify(actual) !== JSON.stringify([...columns[table]].sort()))
      throw Error(
        `Colunas divergentes em ${table}; revise o schema antes de migrar.`,
      );
  }
}
async function snapshot(client) {
  const data = {};
  for (const table of tables) {
    // Text casts preserve bigint IDs, nulls, and timestamp microseconds exactly.
    data[table] = (
      await client.query(`select ${columns[table].map((c) => `${quote(c)}::text as ${quote(c)}`).join(",")}
      from public.${quote(table)} order by id`)
    ).rows;
  }
  return data;
}
async function main() {
  const mode = process.argv[2] ?? "inspect";
  if (!["inspect", "migrate", "verify"].includes(mode))
    throw Error("Use inspect, migrate ou verify.");
  const sourceUrl = process.env.LEGACY_DATABASE_URL;
  const targetUrl = process.env.SUPABASE_DATABASE_URL;
  if (!sourceUrl) throw Error("Configure LEGACY_DATABASE_URL localmente.");
  if (mode !== "inspect" && !targetUrl)
    throw Error("Configure SUPABASE_DATABASE_URL localmente.");
  if (sourceUrl === targetUrl)
    throw Error("Origem e destino não podem ser iguais.");
  const source = new pg.Client({
    connectionString: sourceUrl,
    connectionTimeoutMillis: 15000,
    options: "-c default_transaction_read_only=on",
  });
  const target =
    targetUrl && mode !== "inspect"
      ? new pg.Client({
          connectionString: targetUrl,
          connectionTimeoutMillis: 15000,
        })
      : null;
  let targetTransaction = false;
  try {
    await source.connect();
    await source.query("begin isolation level repeatable read read only");
    await source.query("set local statement_timeout='60s'");
    const metadata = await schema(source);
    assertColumns(metadata);
    const userTables = (
      await source.query(
        "select tablename from pg_tables where schemaname='public' order by tablename",
      )
    ).rows.map((r) => r.tablename);
    if (userTables.some((t) => !tables.includes(t)))
      throw Error(
        "Existem tabelas adicionais no banco original. Amplie a auditoria antes de migrar.",
      );
    const constraints = await constraintsFor(source);
    const indexes = (
      await source.query(
        "select tablename,indexname,indexdef from pg_indexes where schemaname=$1 and tablename=any($2) order by tablename,indexname",
        ["public", tables],
      )
    ).rows;
    const triggers = (
      await source.query(
        `select cl.relname as table_name,t.tgname,pg_get_triggerdef(t.oid) as definition
      from pg_trigger t join pg_class cl on cl.oid=t.tgrelid join pg_namespace n on n.oid=cl.relnamespace
      where not t.tgisinternal and n.nspname='public' and cl.relname=any($1)`,
        [tables],
      )
    ).rows;
    const data = await snapshot(source);
    const sequences = {};
    for (const table of tables) {
      const sequence = (
        await source.query("select pg_get_serial_sequence($1,$2) as name", [
          "public." + table,
          "id",
        ])
      ).rows[0].name;
      if (!sequence) throw Error(`Identity/sequence ausente em ${table}.`);
      // pg_get_serial_sequence is server-owned metadata, still quote each qualified identifier.
      const sequencePath = sequence
        .split(".")
        .map((s) => quote(s.replace(/^"|"$/g, "")))
        .join(".");
      sequences[table] = (
        await source.query(
          `select last_value::text,is_called from ${sequencePath}`,
        )
      ).rows[0];
    }
    const counts = Object.fromEntries(tables.map((t) => [t, data[t].length]));
    console.log(
      JSON.stringify(
        {
          mode,
          counts,
          columns: metadata.map(({ column_default, ...rest }) => rest),
          constraints,
          indexes,
          triggers,
        },
        null,
        2,
      ),
    );
    if (mode === "inspect") {
      await source.query("commit");
      return;
    }
    await target.connect();
    await target.query("begin isolation level serializable");
    targetTransaction = true;
    await target.query("set local lock_timeout='10s'");
    const targetSchema = await schema(target);
    assertColumns(targetSchema);
    const targetConstraints = await constraintsFor(target);
    for (const constraint of constraints) {
      // PostgreSQL 18 exposes NOT NULL entries through pg_constraint; older
      // Supabase PostgreSQL versions represent the same rule in pg_attribute.
      // Nullability is already compared above through information_schema.
      if (constraint.definition.startsWith("NOT NULL ")) continue;
      if (
        !targetConstraints.some(
          (c) =>
            c.table_name === constraint.table_name &&
            c.definition === constraint.definition,
        )
      )
        throw Error(
          `Schema divergente: constraint de ${constraint.table_name} não representada no destino.`,
        );
    }
    if (triggers.length)
      throw Error(
        "Schema divergente: existem triggers personalizados na origem; revise antes de migrar.",
      );
    for (const sourceColumn of metadata) {
      const dest = targetSchema.find(
        (c) =>
          c.table_name === sourceColumn.table_name &&
          c.column_name === sourceColumn.column_name,
      );
      for (const key of [
        "udt_name",
        "character_maximum_length",
        "is_nullable",
      ]) {
        if (dest[key] !== sourceColumn[key])
          throw Error(
            `Schema divergente em ${sourceColumn.table_name}.${sourceColumn.column_name} (${key}).`,
          );
      }
    }
    if (mode === "migrate") {
      await target.query(
        "lock table public.about, public.music, public.events, public.admin_users in access exclusive mode",
      );
      for (const table of tables) {
        const count = (
          await target.query(
            `select count(*)::int as n from public.${quote(table)}`,
          )
        ).rows[0].n;
        if (count)
          throw Error(
            `Destino ${table} não está vazio. Nenhum registro será sobrescrito.`,
          );
      }
      const directory =
        "migration-private/" + new Date().toISOString().replaceAll(":", "-");
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        directory + "/snapshot.json",
        JSON.stringify(
          { metadata, constraints, indexes, triggers, sequences, data },
          null,
          2,
        ),
        { mode: 0o600 },
      );
      writeFileSync(
        directory + "/checksums.json",
        JSON.stringify(
          Object.fromEntries(
            tables.map((t) => [
              t,
              { count: data[t].length, sha256: hash(data[t]) },
            ]),
          ),
          null,
          2,
        ),
        { mode: 0o600 },
      );
      for (const table of tables) {
        const names = columns[table];
        for (const row of data[table])
          await target.query(
            `insert into public.${quote(table)}(${names.map(quote).join(",")})
          values(${names.map((_, i) => "$" + (i + 1)).join(",")})`,
            names.map((n) => row[n]),
          );
      }
    }
    const copied = await snapshot(target);
    for (const table of tables) {
      if (hash(data[table]) !== hash(copied[table]))
        throw Error(`Verificação integral falhou em ${table}.`);
    }
    if (mode === "migrate") {
      for (const table of tables) {
        const highest = data[table].reduce(
          (n, r) => (BigInt(r.id) > n ? BigInt(r.id) : n),
          0n,
        );
        const state = sequences[table];
        const value =
          BigInt(state.last_value) > highest
            ? BigInt(state.last_value)
            : highest;
        await target.query(
          "select setval(pg_get_serial_sequence($1,$2),$3::bigint,$4)",
          [
            "public." + table,
            "id",
            String(value || 1n),
            state.is_called || highest > 0n,
          ],
        );
      }
    }
    await target.query("commit");
    targetTransaction = false;
    await source.query("commit");
    console.log(
      JSON.stringify({
        result: "verified",
        counts,
        allColumnsEqual: true,
        sourceReadOnly: true,
      }),
    );
  } finally {
    if (targetTransaction) await target.query("rollback").catch(() => {});
    await source.end().catch(() => {});
    if (target) await target.end().catch(() => {});
  }
}
main().catch((error) => {
  // Driver errors can include credentials or row values; never print them.
  const known =
    /^(Configure |Use |Origem |Colunas |Existem tabelas |Identity\/sequence |Schema divergente |Destino |Verificação integral)/;
  console.error(
    known.test(error.message)
      ? error.message
      : "Migração interrompida. Verifique conexão, permissões e schema; nenhum detalhe sensível foi exibido.",
  );
  process.exitCode = 1;
});
