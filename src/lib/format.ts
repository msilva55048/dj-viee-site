export function formatDate(value: string | null, time = false): string {
  if (!value) return "";
  const date = value.slice(0, 10).split("-").reverse().join("/");
  return time ? `${date} ${value.slice(11, 16)}` : date;
}

export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else id = /^\/(?:embed|shorts)\/([^/]+)/.exec(url.pathname)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function safeMediaUrl(value: string): string {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol) ? value : "#";
  } catch {
    return "#";
  }
}
