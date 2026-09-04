import type { NextApiRequest, NextApiResponse } from "next";
import { readEvents } from "@/server/content";
import { currentAdmin, validCsrf } from "@/server/auth";
import { database, checked } from "@/server/supabase";
import { recordId, FormError } from "@/server/validation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  const sendEvents = (data: unknown) => {
    const rawJSON = (JSON as typeof JSON & { rawJSON(text: string): unknown })
      .rawJSON;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Keep the original JSON numeric IDs without losing PostgreSQL bigint precision.
    return res
      .status(200)
      .send(
        JSON.stringify(data, (key, value) =>
          key === "id" && typeof value === "string" && /^[1-9]\d*$/.test(value)
            ? rawJSON(value)
            : value,
        ),
      );
  };
  const ids = req.query.id;
  try {
    if (req.method === "GET" && !ids?.length)
      return sendEvents(await readEvents());
    if (!["POST", "DELETE"].includes(req.method ?? "")) {
      res.setHeader("Allow", "GET, POST, DELETE");
      return res.status(405).end();
    }
    if (!(await currentAdmin(req)))
      return res.status(401).json({ message: "Acesso negado." });
    if (!validCsrf(req, req.headers["x-csrf-token"] ?? req.body?._csrf))
      return res.status(403).json({ message: "Acesso negado." });
    if (req.method === "DELETE" && Array.isArray(ids) && ids.length === 1) {
      checked(
        await database(true).from("events").delete().eq("id", recordId(ids[0])),
      );
      return res.status(200).end();
    }
    if (req.method !== "POST" || ids?.length) return res.status(404).end();
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new FormError("error_fields");
    const data: Record<string, string | null> = {};
    // Preserve nullable API fields, including ticketUrl which has no visible admin field.
    for (const [name, column, max] of [
      ["title", "title", 255],
      ["city", "city", 255],
      ["location", "location", 255],
      ["description", "description", 1000],
      ["ticketUrl", "ticket_url", 255],
      ["eventDate", "event_date", 10],
    ] as const) {
      const value = body[name] ?? null;
      if (value !== null && (typeof value !== "string" || value.length > max))
        throw new FormError("error_fields");
      data[column] = value;
    }
    if (
      data.event_date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(data.event_date) ||
        Number.isNaN(Date.parse(data.event_date)) ||
        new Date(data.event_date).toISOString().slice(0, 10) !==
          data.event_date)
    )
      throw new FormError("error_fields");
    const row = {
      title: data.title,
      city: data.city,
      location: data.location,
      description: data.description,
      ticket_url: data.ticket_url,
      event_date: data.event_date,
    };
    let result;
    if (body.id != null) {
      if (typeof body.id === "number" && !Number.isSafeInteger(body.id))
        throw new FormError("error_fields");
      const id = recordId(String(body.id));
      // JPA save updates a supplied ID; preserve it without changing identity sequences.
      result = await database(true)
        .from("events")
        .update(row)
        .eq("id", id)
        .select(
          "id::text,title,eventDate:event_date,city,location,description,ticketUrl:ticket_url",
        )
        .single();
    } else {
      result = await database(true)
        .from("events")
        .insert(row)
        .select(
          "id::text,title,eventDate:event_date,city,location,description,ticketUrl:ticket_url",
        )
        .single();
    }
    return sendEvents(checked(result));
  } catch (error) {
    return res
      .status(error instanceof FormError ? 400 : 503)
      .json({ message: "Não foi possível concluir a operação." });
  }
}
