-- Our Memory in Taipei — the memories table, the photo bucket and the rules that keep them safe.
-- Run it in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- It is idempotent: running it again on a project that already has it (an older version included)
-- updates the rules and adds what is missing, and never deletes a memory.
--
-- The page talks to Supabase with the public "anon" key. These rules are what keep that safe:
--   anyone may READ memories that are approved (and only the columns the page shows),
--   anyone may SUBMIT a memory, but only as 'pending', and only so fast (the trigger below),
--   anyone may UPLOAD one photo for a memory they have just submitted, and nothing else:
--     no overwriting, listing or deleting, no photo without a pending memory waiting for it.
-- Approving, rejecting and deleting happen in the dashboard (docs/MEMORIES.md), never from the page.
--
-- 2026-11-03 (item #1 of research/similar-works/README.md §5): the id is now made by the page
-- (crypto.randomUUID), because the anon key cannot read a pending row back after inserting it
-- (RLS only shows approved ones), and the photo is named after it: <id>.webp (or <id>.jpg where the
-- browser cannot make webp). The page sends the row first, with photo_path already filled in, then
-- the photo; the storage rule lets the photo in only if that row is waiting for exactly that file.
-- There is deliberately no update grant: nobody can edit a memory from the page, not even its own
-- writer, so a pending memory cannot be changed after the makers have read it.
--
-- 2026-11-03 (items #11 #12 #23): a memory may carry a title (its label's first line, 40 characters)
-- and a place (one of the page's landmarks, by id: memories.js LANDMARKS; empty = the nearest is
-- named). And a visitor may say 「我也記得 · I remember this too」: the offerings table takes one row
-- per press and nothing can read it back; the memory_warmth view gives only a coarse level, 1 to 3,
-- for each approved memory that has any. The page never shows a number, and nothing here returns one.

create table if not exists public.memories (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  section     text not null check (section in ('square', 'red', 'dadao', 'tower')),
  x           real not null check (x between -60 and 60),
  z           real not null check (z between -500 and 250),
  year        int  check (year between 1900 and 2100),
  body        text not null check (char_length(body) between 1 and 280),
  name        text check (char_length(name) <= 40),
  photo_path  text check (photo_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

-- item #5: whose memory it is (「這是誰的記憶：我的／爸媽的／阿公阿嬤的」). Rows from before this column
-- take the default, 'me' (the writer's own), which is what the old form meant.
alter table public.memories add column if not exists whose text default 'me';
alter table public.memories drop constraint if exists memories_whose_check;
alter table public.memories add constraint memories_whose_check check (whose in ('me', 'parents', 'grandparents'));

-- items #11 #12: the label's title, and the place by landmark id (the shape is checked here, the list
-- lives in memories.js so a landmark can be added without touching the database)
alter table public.memories add column if not exists title text;
alter table public.memories add column if not exists place text;
alter table public.memories drop constraint if exists memories_title_len;
alter table public.memories add constraint memories_title_len check (title is null or char_length(title) between 1 and 40);
alter table public.memories drop constraint if exists memories_place_id;
alter table public.memories add constraint memories_place_id check (place is null or place ~ '^[a-z0-9-]{1,24}$');

-- spam control (the trigger below): a one-way hash of the sender's address, never shown, never granted
alter table public.memories add column if not exists source_hash text;

-- a photo may only carry the memory's own name, so one memory can never point at another's photo.
-- NOT VALID (review, 2026-11-03): the page before this version named a photo with a second random uuid,
-- so an older row's photo_path is not its id, and checking old rows would make a re-run fail. New rows
-- are checked; old ones keep the photo they have.
alter table public.memories drop constraint if exists memories_photo_is_own;
alter table public.memories add constraint memories_photo_is_own
  check (photo_path is null or photo_path in (id::text || '.webp', id::text || '.jpg')) not valid;

-- the year belongs to the street it hangs on (the form only offers these; item #5). NOT VALID so that
-- re-running this on a project with older rows never fails; new and edited rows are checked.
alter table public.memories drop constraint if exists memories_year_in_era;
alter table public.memories add constraint memories_year_in_era check (year is null or
     (section = 'square' and year between 1950 and 2100)
  or (section = 'red'    and year between 1985 and 1999)
  or (section = 'dadao'  and year between 2000 and 2019)
  or (section = 'tower'  and year between 2020 and 2027)) not valid;

create index if not exists memories_approved on public.memories (status, created_at desc);
create index if not exists memories_recent on public.memories (created_at desc);

alter table public.memories enable row level security;

drop policy if exists "read approved memories" on public.memories;
create policy "read approved memories" on public.memories
  for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "submit a pending memory" on public.memories;
create policy "submit a pending memory" on public.memories
  for insert to anon, authenticated
  with check (status = 'pending');

-- The visitor's role may only write these columns; created_at, status and source_hash take their
-- defaults or the trigger's value. id is the page's own uuid: a repeated one fails on the primary key.
revoke insert, update, delete on public.memories from anon, authenticated;
grant insert (id, section, x, z, year, body, name, whose, photo_path, title, place) on public.memories to anon, authenticated;
-- and read only what the page shows (source_hash stays private even on an approved row)
revoke select on public.memories from anon, authenticated;
grant select (id, created_at, section, x, z, year, body, name, whose, photo_path, status, title, place) on public.memories to anon, authenticated;

-- ── the speed limit ─────────────────────────────────────────────────────────────
-- Before every insert. SECURITY DEFINER with a fixed search_path: run as the visitor it would be
-- under RLS and count 0 pending rows, and see none of the bodies it must compare against.
-- Generous on purpose (item #1, 風險): PostgREST may see a proxy's address for many people at once.
create or replace function public.memories_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  per_minute constant int := 12;           -- pending memories from the whole world in one minute
  per_source constant int := 6;            -- from one address in ten minutes
  hdrs json;
  src text;
begin
  new.body := btrim(new.body);
  new.title := nullif(btrim(regexp_replace(coalesce(new.title, ''), '\s+', ' ', 'g')), '');
  if new.whose is null then new.whose := 'me'; end if;
  -- the visitor can only send 'pending' (RLS and the column grant); a row the makers add in the
  -- dashboard as 'approved' is theirs and skips the limits
  if new.status is distinct from 'pending' then return new; end if;

  if (select count(*) from public.memories
        where status = 'pending' and created_at > now() - interval '1 minute') >= per_minute then
    raise exception 'rate_limited' using errcode = 'PT429', hint = 'Too many memories in the last minute. Try again shortly.';
  end if;

  if exists (select 1 from public.memories
        where created_at > now() - interval '7 days' and lower(body) = lower(new.body)) then
    raise exception 'duplicate' using errcode = 'PT409', hint = 'This memory has already been received.';
  end if;

  -- a rough per-sender limit: the sender's address, hashed with the day so the stored value cannot be
  -- turned back into an address or followed from one day to the next. Which address (review,
  -- 2026-11-03): Supabase sits behind Cloudflare, whose cf-connecting-ip a sender cannot forge; the
  -- first X-Forwarded-For entry is whatever the sender wrote there, so it is only the last resort
  -- (the site-wide limit above holds even when a sender lies about it)
  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then hdrs := null;
  end;
  src := nullif(btrim(coalesce(hdrs ->> 'cf-connecting-ip', hdrs ->> 'x-real-ip',
                               split_part(coalesce(hdrs ->> 'x-forwarded-for', ''), ',', 1))), '');
  if src is not null then
    new.source_hash := encode(sha256(convert_to(src || '|' || to_char(now() at time zone 'utc', 'YYYY-MM-DD') || '|our-memory-in-taipei', 'UTF8')), 'hex');
    if (select count(*) from public.memories
          where source_hash = new.source_hash and created_at > now() - interval '10 minutes') >= per_source then
      raise exception 'rate_limited' using errcode = 'PT429', hint = 'Too many memories from here. Try again later.';
    end if;
  else
    new.source_hash := null;
  end if;
  return new;
end;
$$;

revoke all on function public.memories_before_insert() from public, anon, authenticated;

drop trigger if exists memories_before_insert on public.memories;
create trigger memories_before_insert
  before insert on public.memories
  for each row execute function public.memories_before_insert();

-- ── photos ─────────────────────────────────────────────────────────────────────
-- A public bucket (an approved memory shows its photo by URL), 2 MB, webp or jpeg only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memory-photos', 'memory-photos', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp', 'image/jpeg'];

-- May this file be uploaded? Only if a memory sent in the last hour is still pending, names exactly
-- this file as its photo, and has no file yet (so a second photo for the same memory fails, and the
-- bucket can never become a free image host or collect orphans). SECURITY DEFINER because the
-- visitor cannot see pending rows; it returns only true or false, never anything of the memory.
create or replace function public.memory_photo_ok(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
     and exists (
       select 1 from public.memories m
        where m.id::text = split_part(object_name, '.', 1)
          and m.status = 'pending'
          and m.photo_path = object_name
          and m.created_at > now() - interval '1 hour')
     and not exists (
       select 1 from storage.objects o
        where o.bucket_id = 'memory-photos'
          and split_part(o.name, '.', 1) = split_part(object_name, '.', 1));
$$;

revoke all on function public.memory_photo_ok(text) from public;
grant execute on function public.memory_photo_ok(text) to anon, authenticated;

drop policy if exists "upload a memory photo" on storage.objects;
create policy "upload a memory photo" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'memory-photos' and public.memory_photo_ok(name));

-- ── 我也記得 · I remember this too (item #23) ─────────────────────────────────────
-- One row each time a visitor presses it on an approved memory (the page lets each browser press it
-- once per memory). Insert-only: the visitor may write memory_id and nothing else, and nobody can read
-- the rows from the page, so no count ever leaves the database. Same speed limit as the memories
-- (item #1): a SECURITY DEFINER trigger with a fixed search_path.
create table if not exists public.offerings (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  memory_id   uuid not null references public.memories (id) on delete cascade,
  source_hash text
);
create index if not exists offerings_memory on public.offerings (memory_id);
create index if not exists offerings_recent on public.offerings (created_at desc);
create index if not exists offerings_source on public.offerings (source_hash, created_at desc);

alter table public.offerings enable row level security;
drop policy if exists "leave an offering" on public.offerings;
create policy "leave an offering" on public.offerings
  for insert to anon, authenticated
  with check (true);                        -- the trigger below decides: an approved memory, not too fast
revoke all on public.offerings from anon, authenticated;
grant insert (memory_id) on public.offerings to anon, authenticated;

create or replace function public.offerings_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  per_minute constant int := 240;          -- from the whole world in one minute
  per_source constant int := 40;           -- from one address in ten minutes
  hdrs json;
  src text;
begin
  -- only an approved memory can be remembered (a pending id from a share link cannot collect any)
  if not exists (select 1 from public.memories where id = new.memory_id and status = 'approved') then
    raise exception 'not_found' using errcode = 'PT404', hint = 'No such memory.';
  end if;
  if (select count(*) from public.offerings where created_at > now() - interval '1 minute') >= per_minute then
    raise exception 'rate_limited' using errcode = 'PT429', hint = 'Too many in the last minute. Try again shortly.';
  end if;
  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then hdrs := null;
  end;
  src := nullif(btrim(coalesce(hdrs ->> 'cf-connecting-ip', hdrs ->> 'x-real-ip',
                               split_part(coalesce(hdrs ->> 'x-forwarded-for', ''), ',', 1))), '');
  if src is not null then
    new.source_hash := encode(sha256(convert_to(src || '|' || to_char(now() at time zone 'utc', 'YYYY-MM-DD') || '|our-memory-in-taipei', 'UTF8')), 'hex');
    if (select count(*) from public.offerings
          where source_hash = new.source_hash and created_at > now() - interval '10 minutes') >= per_source then
      raise exception 'rate_limited' using errcode = 'PT429', hint = 'Too many from here. Try again later.';
    end if;
    -- the same address, the same memory, the same day: once (a cleared browser cannot press it twice)
    if exists (select 1 from public.offerings where source_hash = new.source_hash and memory_id = new.memory_id) then
      raise exception 'duplicate' using errcode = 'PT409', hint = 'Already remembered.';
    end if;
  else
    new.source_hash := null;
  end if;
  new.created_at := now();
  return new;
end;
$$;

revoke all on function public.offerings_before_insert() from public, anon, authenticated;

drop trigger if exists offerings_before_insert on public.offerings;
create trigger offerings_before_insert
  before insert on public.offerings
  for each row execute function public.offerings_before_insert();

-- The only thing anyone can read about offerings: a level per approved memory. 1 for a few, 2 for
-- several, 3 for many; a memory with none has no row (level 0). Thresholds are coarse on purpose, so
-- the level cannot be turned back into a count. It runs with its owner's rights (security_invoker
-- off), which is what lets it read a table the visitor cannot; it returns only these two columns.
create or replace view public.memory_warmth with (security_invoker = false) as
  select o.memory_id,
         (case when count(*) >= 12 then 3 when count(*) >= 4 then 2 else 1 end)::int as level
    from public.offerings o
    join public.memories m on m.id = o.memory_id and m.status = 'approved'
   group by o.memory_id;
revoke all on public.memory_warmth from public, anon, authenticated;
grant select on public.memory_warmth to anon, authenticated;
