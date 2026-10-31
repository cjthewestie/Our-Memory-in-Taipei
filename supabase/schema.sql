-- Our Memory in Taipei — the memories table and the photo bucket.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
--
-- The page talks to Supabase with the public "anon" key. These rules are what keep that safe:
--   anyone may READ memories that are approved,
--   anyone may SUBMIT a memory, but only as 'pending',
--   anyone may UPLOAD a photo (small webp/jpeg only) — never overwrite, list or delete one.
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

-- photos: a public bucket (approved memories show their photo by URL), 2 MB, webp or jpeg only.
-- File names are random UUIDs chosen by the page, so a pending photo cannot be guessed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memory-photos', 'memory-photos', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp', 'image/jpeg'];

drop policy if exists "upload a memory photo" on storage.objects;
create policy "upload a memory photo" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'memory-photos' and name ~ '^[0-9a-f-]{36}\.(webp|jpg)$');
