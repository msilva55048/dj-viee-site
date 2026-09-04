const base = process.env.SUPABASE_URL;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!base || !publishable || !secret) throw Error("Variáveis do Supabase ausentes.");

async function request(table, key) {
  return fetch(`${base}/rest/v1/${table}?select=id`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      prefer: "count=exact",
    },
  });
}

const publicExpected = { about: 1, events: 1, featured_music: 6 };
for (const [table, expected] of Object.entries(publicExpected)) {
  const response = await request(table, publishable);
  if (!response.ok) throw Error(`Leitura pública falhou em ${table}.`);
  const rows = await response.json();
  if (rows.length !== expected) throw Error(`Contagem pública inesperada em ${table}.`);
}
for (const table of ["music", "admin_users", "admin_sessions", "login_attempts"]) {
  const response = await request(table, publishable);
  if (response.ok) throw Error(`A chave pública obteve acesso indevido a ${table}.`);
}
const privilegedExpected = { about: 1, music: 7, events: 1, admin_users: 1 };
for (const [table, expected] of Object.entries(privilegedExpected)) {
  const response = await request(table, secret);
  if (!response.ok) throw Error(`Leitura server-side falhou em ${table}.`);
  const rows = await response.json();
  if (rows.length !== expected) throw Error(`Contagem server-side inesperada em ${table}.`);
}
console.log(
  JSON.stringify({
    result: "verified",
    publicReads: publicExpected,
    publicPrivateTablesBlocked: true,
    serverSideReads: privilegedExpected,
  }),
);
