import { createClient } from "@supabase/supabase-js";

export function database(privileged = false) {
  const url = process.env.SUPABASE_URL;
  const key = privileged
    ? process.env.SUPABASE_SECRET_KEY
    : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase não configurado.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  });
}

export function checked<T>(result: {
  data: T;
  error: unknown;
}): NonNullable<T> {
  if (result.error)
    throw new Error("Não foi possível concluir a operação no banco de dados.");
  return result.data as NonNullable<T>;
}
