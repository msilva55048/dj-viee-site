import { database, checked } from "./supabase";
import type { About, Music, Event, ContentProps } from "@/types/content";
import { defaultAbout } from "@/lib/default-about";

// Explicit projections prevent private columns from reaching page props.
const musicColumns =
  "id::text,title,artists,youtubeUrl:youtube_url,youtubeVideoId:youtube_video_id,position,createdAt:created_at";
const eventColumns =
  "id::text,title,eventDate:event_date,city,location,description,ticketUrl:ticket_url";
const aboutColumns =
  "id::text,paragraph1:paragraph_1,paragraph2:paragraph_2,paragraph3:paragraph_3,updatedAt:updated_at";

export async function readAbout(): Promise<About> {
  const rows = checked(
    await database().from("about").select(aboutColumns).order("id").limit(1),
  );
  return (rows[0] as unknown as About) ?? { ...defaultAbout };
}
export async function readMusic(featured = false): Promise<Music[]> {
  const db = database(!featured);
  if (featured)
    return checked(
      await db
        .from("featured_music")
        .select(musicColumns)
        .order("position")
        .order("id")
        .limit(6),
    ) as unknown as Music[];
  const result: Music[] = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = checked(
      await db
        .from("music")
        .select(musicColumns)
        .order("position")
        .order("id")
        .range(offset, offset + 999),
    ) as unknown as Music[];
    result.push(...rows);
    if (rows.length < 1000) return result;
  }
}
export async function readEvents(): Promise<Event[]> {
  const result: Event[] = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = checked(
      await database()
        .from("events")
        .select(eventColumns)
        .order("id")
        .range(offset, offset + 999),
    ) as unknown as Event[];
    result.push(...rows);
    if (rows.length < 1000) return result;
  }
}
export function emptyProps(): ContentProps {
  return {
    about: { ...defaultAbout },
    musics: [],
    events: [],
    username: "",
    csrf: "",
    successMessage: "",
    errorMessage: "",
  };
}
export async function publicContent(): Promise<ContentProps> {
  const [about, musics, events] = await Promise.all([
    readAbout(),
    readMusic(true),
    readEvents(),
  ]);
  return { ...emptyProps(), about, musics, events };
}
