import type { NextApiRequest, NextApiResponse } from "next";
import { hash, compare } from "bcryptjs";
import {
  createSession,
  currentAdmin,
  validCsrf,
  login,
  logout,
  digest,
} from "@/server/auth";
import { database, checked } from "@/server/supabase";
import { field, recordId, eventFields, FormError } from "@/server/validation";
import { youtubeId } from "@/lib/format";

export const config = { api: { bodyParser: { sizeLimit: "256kb" } } };
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const path = Array.isArray(req.query.path) ? req.query.path.join("/") : "";
  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  if (!validCsrf(req, body._csrf))
    return res.status(403).send("Acesso negado.");
  const destinations: Record<string, string> = {
    "admin/sobre": "/admin/sobre",
    "admin/musicas": "/admin/musicas",
    "admin/musicas/excluir": "/admin/musicas",
    "admin/eventos": "/admin/eventos",
    "admin/eventos/editar": "/admin/eventos",
    "admin/eventos/excluir": "/admin/eventos",
    "admin/conta/senha": "/admin/conta",
  };
  const destination = destinations[path];
  try {
    if (path === "login") {
      const username = field(body, "username", 100, false);
      const password = field(body, "password", 4096, false);
      const ok = await login(req, res, username, password);
      const next =
        typeof body.next === "string" &&
        /^\/admin(?:\/(?:sobre|musicas|eventos|conta))?$/.test(body.next)
          ? body.next
          : "/admin";
      return res.redirect(303, ok ? next : "/login?error");
    }
    if (path === "logout") {
      await logout(req, res);
      return res.redirect(303, "/login?logout");
    }
    if (!destination) return res.status(404).end();
    const admin = await currentAdmin(req);
    if (!admin) return res.redirect(303, "/login");
    const db = database(true);
    let message = "";
    if (path === "admin/sobre") {
      checked(
        await db.rpc("save_about", {
          p_1: field(body, "paragraph1", 60000, false),
          p_2: field(body, "paragraph2", 60000, false),
          p_3: field(body, "paragraph3", 60000, false),
        }),
      );
      message = "about_saved";
    } else if (path === "admin/musicas") {
      const title = field(body, "title", 180),
        artists = field(body, "artists", 220),
        url = field(body, "youtubeUrl", 500);
      const video = youtubeId(url);
      if (!video) throw new FormError("error_youtube");
      checked(
        await db.rpc("add_music", {
          p_title: title,
          p_artists: artists,
          p_url: url,
          p_video_id: video,
        }),
      );
      message = "music_added";
    } else if (path === "admin/musicas/excluir") {
      const result = await db.rpc("delete_music", { p_id: recordId(body.id) });
      if (result.error?.message.includes("Música não encontrada"))
        throw new FormError("error_music");
      checked(result);
      message = "music_deleted";
    } else if (path === "admin/eventos") {
      checked(await db.from("events").insert(eventFields(body)));
      message = "event_added";
    } else if (path === "admin/eventos/editar") {
      const data = checked(
        await db
          .from("events")
          .update(eventFields(body))
          .eq("id", recordId(body.id))
          .select("id::text"),
      );
      if (!data.length) throw new FormError("error_event");
      message = "event_updated";
    } else if (path === "admin/eventos/excluir") {
      const data = checked(
        await db
          .from("events")
          .delete()
          .eq("id", recordId(body.id))
          .select("id::text"),
      );
      if (!data.length) throw new FormError("error_event");
      message = "event_deleted";
    } else if (path === "admin/conta/senha") {
      const allowed = checked(
        await db.rpc("consume_login_attempt", {
          p_key: digest("password:" + admin.id),
        }),
      );
      if (!allowed) throw new FormError("error_operation");
      const user = checked(
        await db
          .from("admin_users")
          .select("password")
          .eq("id", admin.id)
          .single(),
      );
      const current = field(body, "currentPassword", 4096, false);
      if (!(await compare(current, user.password)))
        throw new FormError("error_current");
      const next = typeof body.newPassword === "string" ? body.newPassword : "";
      if (next.length < 8) throw new FormError("error_short");
      if (next.length > 4096) throw new FormError("error_fields");
      if (next !== body.confirmPassword) throw new FormError("error_confirm");
      if (await compare(next, user.password)) throw new FormError("error_same");
      const changed = checked(
        await db.rpc("change_admin_password", {
          p_id: admin.id,
          p_old_hash: user.password,
          p_new_hash: await hash(next, 12),
        }),
      );
      if (!changed) throw new FormError("error_current");
      await createSession(res, admin.id);
      message = "password_changed";
    }
    return res.redirect(303, destination + "?message=" + message);
  } catch (error) {
    if (path === "login") return res.redirect(303, "/login?error");
    if (!destination)
      return res.status(503).send("Não foi possível concluir a operação.");
    const message =
      error instanceof FormError
        ? error.code
        : path === "admin/eventos"
          ? "error_event_add"
          : "error_operation";
    return res.redirect(303, destination + "?message=" + message);
  }
}
