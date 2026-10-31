-- Our Memory in Taipei — the memories table and the photo bucket.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
--
-- The page talks to Supabase with the public "anon" key. These rules are what keep that safe:
--   anyone may READ memories that are approved,
--   anyone may SUBMIT a memory, but only as 'pending',
--   anyone may UPLOAD a photo (small webp/jpeg only) into a PRIVATE bucket — never read, overwrite, list or delete one,
--   anyone may READ a photo only once the memory that names it is approved (pending and rejected photos stay private),
--   at most 500 memories may wait in the queue, and at most 20 new ones (or 20 photos) arrive per minute, site-wide.
-- Approving, rejecting and deleting happen in the dashboard (docs/MEMORIES.md), never from the page.

create table if not exists public.memories (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  section     text not null check (section in ('square', 'red', 'dadao', 'tower')),
  x           real not null check (x between -60 and 60),
  z           real not null check (z between -500 and 250),
  year        int  check (year between 1900 and 2100),
  body        text not null check (char_length(body) between 1 and 280),
  name        text check (char_length(name) <= 40),
  photo_path  text check (photo_path ~ '^[0-9a-f-]{36}\.(webp|jpg)$'),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists memories_approved on public.memories (status, created_at desc);

alter table public.memories enable row level security;

drop policy if exists "read approved memories" on public.memories;
create policy "read approved memories" on public.memories
  for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "submit a pending memory" on public.memories;
create policy "submit a pending memory" on public.memories
  for insert to anon, authenticated
  with check (status = 'pending');

-- the visitor's role may only write these columns; id, created_at and status take their defaults
revoke insert on public.memories from anon, authenticated;
grant insert (section, x, z, year, body, name, photo_path) on public.memories to anon, authenticated;
grant select on public.memories to anon, authenticated;

-- the queue cannot be flooded: a trigger refuses a new memory when 500 already wait, or when 20 arrived in
-- the last minute (site-wide). It runs as the table owner because the visitor's role cannot see pending rows.
create or replace function public.memories_throttle() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.memories where status = 'pending') >= 500 then
    raise exception 'The memory queue is full. Please try again later.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.memories where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many memories this minute. Please try again shortly.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.memories_throttle() from public, anon, authenticated;

drop trigger if exists memories_throttle on public.memories;
create trigger memories_throttle before insert on public.memories
  for each row execute function public.memories_throttle();

-- photos: a PRIVATE bucket, 2 MB, webp or jpeg only. Nothing in it has a public URL.
-- The page uploads under a random UUID name; it can read a photo back only after its memory is approved
-- (the "read an approved memory's photo" policy below), and then through a short-lived signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memory-photos', 'memory-photos', false, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/webp', 'image/jpeg'];

-- uploads are throttled too, so the bucket cannot be filled by a script: at most 20 photos a minute, site-wide.
create or replace function public.memory_photo_upload_ok() returns boolean
language sql stable security definer set search_path = storage, public, pg_temp as $$
  select count(*) < 20 from storage.objects
  where bucket_id = 'memory-photos' and created_at > now() - interval '1 minute';
$$;
revoke all on function public.memory_photo_upload_ok() from public;
grant execute on function public.memory_photo_upload_ok() to anon, authenticated;

-- insert only: no select, update or delete policy exists for the visitor's role on this bucket,
-- except reading the photo of an approved memory.
drop policy if exists "upload a memory photo" on storage.objects;
create policy "upload a memory photo" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'memory-photos'
              and name ~ '^[0-9a-f-]{36}\.(webp|jpg)$'
              and public.memory_photo_upload_ok());

drop policy if exists "read an approved memory's photo" on storage.objects;
create policy "read an approved memory's photo" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'memory-photos'
         and exists (select 1 from public.memories m
                     where m.photo_path = storage.objects.name and m.status = 'approved'));
