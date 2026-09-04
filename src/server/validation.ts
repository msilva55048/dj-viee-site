export class FormError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export function field(
  body: Record<string, unknown>,
  name: string,
  max: number,
  trim = true,
): string {
  const value = body[name];
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new FormError("error_fields");
  return trim ? value.trim() : value;
}
export function recordId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d{0,18}$/.test(value) ||
    BigInt(value) > 9223372036854775807n
  )
    throw new FormError("error_fields");
  return value;
}
export function eventFields(body: Record<string, unknown>) {
  const eventDate = field(body, "eventDate", 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    Number.isNaN(Date.parse(eventDate)) ||
    new Date(eventDate).toISOString().slice(0, 10) !== eventDate
  )
    throw new FormError("error_fields");
  const description = body.description ?? "";
  if (typeof description !== "string" || description.length > 1000)
    throw new FormError("error_fields");
  return {
    title: field(body, "title", 255),
    city: field(body, "city", 255),
    location: field(body, "location", 255),
    event_date: eventDate,
    description: description.trim(),
  };
}
