export type Music = {
  id: string;
  title: string;
  artists: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  position: number;
  createdAt: string;
};
export type Event = {
  id: string;
  title: string | null;
  eventDate: string | null;
  city: string | null;
  location: string | null;
  description: string | null;
  ticketUrl: string | null;
};
export type About = {
  id: string | null;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  updatedAt: string | null;
};
export type ContentProps = {
  about: About;
  musics: Music[];
  events: Event[];
  username: string;
  csrf: string;
  successMessage: string;
  errorMessage: string;
};
