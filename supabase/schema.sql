-- RecallAI Supabase schema
-- Run this in your Supabase project's SQL Editor (Project → SQL Editor → New Query → Run).
--
-- This replaces any earlier "user_sync_data" table some builds of this app
-- shipped with. That table stored every user's data under a single
-- hardcoded id ('default_user') and had a `USING (true)` policy, which
-- meant ANY visitor with your anon key could read or overwrite everyone's
-- decks. This schema scopes every row to the signed-in user via
-- auth.uid() and Row Level Security, so users can only ever see or
-- modify their own data.

-- 1. One row per user, holding their whole local library as JSON.
--    Keeping decks/cards/profile as JSONB (instead of fully relational
--    tables) matches the shape the client already works with and keeps
--    sync a single read + single upsert.
create table if not exists public.user_library (
  id uuid primary key references auth.users (id) on delete cascade,
  decks jsonb not null default '[]'::jsonb,
  cards jsonb not null default '[]'::jsonb,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_library enable row level security;

-- Drop any pre-existing, looser policies before recreating them so this
-- script is safe to re-run.
drop policy if exists "Users can view their own library" on public.user_library;
drop policy if exists "Users can insert their own library" on public.user_library;
drop policy if exists "Users can update their own library" on public.user_library;
drop policy if exists "Users can delete their own library" on public.user_library;

create policy "Users can view their own library"
  on public.user_library for select
  using (auth.uid() = id);

create policy "Users can insert their own library"
  on public.user_library for insert
  with check (auth.uid() = id);

create policy "Users can update their own library"
  on public.user_library for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete their own library"
  on public.user_library for delete
  using (auth.uid() = id);

-- 2. Auto-create an empty library row the moment someone signs up, so the
--    very first cloud pull after signup finds a row instead of null.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_library (id, profile)
  values (
    new.id,
    jsonb_build_object(
      'name', coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      'email', new.email,
      'avatar', '',
      'streakDays', 0,
      'lastActiveDate', to_char(now(), 'YYYY-MM-DD'),
      'totalCardsStudied', 0,
      'totalMasteredCount', 0,
      'dailyGoalCards', 20,
      'todayStudiedCount', 0
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. If you deployed an earlier version of this app, drop the old,
--    insecure sync table (uncomment to run):
-- drop table if exists public.user_sync_data;
