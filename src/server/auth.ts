import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { parseCookie as parse, stringifySetCookie } from "cookie";
import { compare } from "bcryptjs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { database, checked } from "./supabase";

export type Admin = { id: string; username: string };
const production = process.env.NODE_ENV === "production";
const sessionCookie = production ? "__Host-djviee-session" : "djviee-session";
const csrfCookie = production ? "__Host-djviee-csrf" : "djviee-csrf";
const cookieOptions = {
  httpOnly: true,
  secure: production,
  sameSite: "lax" as const,
  path: "/",
};
const serialize = (
  name: string,
  value: string,
  options: Omit<Parameters<typeof stringifySetCookie>[0], "name" | "value">,
) => stringifySetCookie({ name, value, ...options });
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const cookies = (req: IncomingMessage) => parse(req.headers.cookie ?? "");
function setCookie(res: ServerResponse, value: string) {
  const previous = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", [
    ...(Array.isArray(previous)
      ? previous.map(String)
      : previous
        ? [String(previous)]
        : []),
    value,
  ]);
}
export function csrfToken(req: IncomingMessage, res: ServerResponse) {
  const existing = cookies(req)[csrfCookie];
  const token =
    existing && /^[a-f0-9]{64}$/.test(existing)
      ? existing
      : randomBytes(32).toString("hex");
  setCookie(res, serialize(csrfCookie, token, cookieOptions));
  return token;
}
export function validCsrf(req: IncomingMessage, token: unknown): boolean {
  const expected = cookies(req)[csrfCookie];
  if (
    typeof token !== "string" ||
    !expected ||
    !/^[a-f0-9]{64}$/.test(token) ||
    !/^[a-f0-9]{64}$/.test(expected)
  )
    return false;
  if (!timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return false;
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  const origin = req.headers.origin;
  if (origin) {
    const site = process.env.SITE_URL;
    if (site) {
      if (origin !== new URL(site).origin) return false;
    } else {
      if (production) return false;
      try {
        if (new URL(origin).host !== req.headers.host) return false;
      } catch {
        return false;
      }
    }
  }
  return true;
}
export async function currentAdmin(
  req: IncomingMessage,
): Promise<Admin | null> {
  const token = cookies(req)[sessionCookie];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = database(true);
  const session = checked(
    await db
      .from("admin_sessions")
      .select("admin_id::text")
      .eq("token_hash", digest(token))
      .gt("expires_at", new Date().toISOString())
      .maybeSingle(),
  );
  if (!session) return null;
  return checked(
    await db
      .from("admin_users")
      .select("id::text,username")
      .eq("id", session.admin_id)
      .maybeSingle(),
  ) as Admin | null;
}
export async function createSession(res: ServerResponse, adminId: string) {
  const token = randomBytes(32).toString("hex");
  const db = database(true);
  checked(
    await db
      .from("admin_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString()),
  );
  checked(
    await db.from("admin_sessions").insert({
      token_hash: digest(token),
      admin_id: adminId,
      expires_at: new Date(Date.now() + 8 * 3600000).toISOString(),
    }),
  );
  setCookie(
    res,
    serialize(sessionCookie, token, { ...cookieOptions, maxAge: 8 * 3600 }),
  );
}
export async function logout(req: IncomingMessage, res: ServerResponse) {
  const token = cookies(req)[sessionCookie];
  if (token)
    checked(
      await database(true)
        .from("admin_sessions")
        .delete()
        .eq("token_hash", digest(token)),
    );
  setCookie(res, serialize(sessionCookie, "", { ...cookieOptions, maxAge: 0 }));
}
export async function login(
  req: IncomingMessage,
  res: ServerResponse,
  username: string,
  password: string,
): Promise<boolean> {
  const db = database(true);
  // The account limit cannot be bypassed by spoofing proxy headers.
  const allowed = checked(
    await db.rpc("consume_login_attempt", {
      p_key: digest("account:" + username),
    }),
  );
  if (!allowed) return false;
  const user = checked(
    await db
      .from("admin_users")
      .select("id::text,password")
      .eq("username", username)
      .maybeSingle(),
  );
  // A valid fixed bcrypt hash is used only for equal-cost rejection of nonexistent users.
  const hash =
    user?.password ??
    "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const matches = await compare(password, hash);
  if (!user || !matches) return false;
  await logout(req, res);
  await createSession(res, String(user.id));
  checked(
    await db
      .from("login_attempts")
      .delete()
      .eq("key_hash", digest("account:" + username)),
  );
  return true;
}
