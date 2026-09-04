-- Supabase REST enables safe-update checks for API sessions.
begin;
create or replace function public.add_music(p_title text, p_artists text, p_url text, p_video_id text)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare new_id bigint;
begin
  perform pg_advisory_xact_lock(61420260904);
  update public.music set position = position + 1 where id is not null;
  insert into public.music(title, artists, youtube_url, youtube_video_id, position, created_at)
    values (trim(p_title), trim(p_artists), trim(p_url), p_video_id, 1, localtimestamp)
    returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.add_music(text,text,text,text) from public, anon, authenticated;
grant execute on function public.add_music(text,text,text,text) to service_role;
commit;
