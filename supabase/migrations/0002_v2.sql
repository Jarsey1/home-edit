-- The Next Home Edit — V2 schema
--
-- Safe, additive migration. The original five tables are left untouched so
-- existing homes, wishlist items, tour notes and budget settings keep working.
-- Run this in Supabase → SQL Editor after 0001_init.sql.
--
-- Owner scoping: the current app has no login, so every row uses the shared
-- workspace owner id ("shared"). The owner_id columns and auth-ready policies
-- below let a deployment switch to Supabase Auth without another remodel.

begin;

create table if not exists public.profiles (
  id text primary key,
  name text not null default '',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  id text primary key,
  owner_id text not null default 'shared',
  name text not null check (length(trim(name)) > 0),
  is_active boolean not null default false,
  budget numeric check (budget is null or budget >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlist_requirements (
  id text primary key,
  wishlist_id text not null references public.wishlists(id) on delete cascade,
  owner_id text not null default 'shared',
  category text not null check (
    category in (
      'location', 'bedrooms', 'interior', 'kitchen',
      'outdoor', 'community', 'condition', 'financial'
    )
  ),
  name text not null check (length(trim(name)) > 0),
  feature_key text not null,
  requirement_type text not null check (
    requirement_type in ('yes', 'min', 'max', 'range', 'text', 'exclude')
  ),
  expected_value jsonb,
  importance text not null check (
    importance in ('must', 'nice', 'dealbreaker', 'ignore')
  ),
  weight numeric check (weight is null or weight >= 0),
  configured boolean not null default true,
  position integer not null default 0,
  custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_details (
  home_id text primary key references public.homes(id) on delete cascade,
  owner_id text not null default 'shared',
  photo text,
  listing_url text not null default '',
  notes text not null default '',
  favorite boolean not null default false,
  facts jsonb not null default '{}'::jsonb,
  tour_date date,
  tour_status text not null default 'none' check (
    tour_status in ('none', 'scheduled', 'toured', 'cancelled')
  ),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_tours (
  id text primary key,
  owner_id text not null default 'shared',
  property_id text not null references public.homes(id) on delete cascade,
  scheduled_date date,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'toured', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.budget_scenarios (
  id text primary key,
  owner_id text not null default 'shared',
  wishlist_id text references public.wishlists(id) on delete set null,
  property_id text references public.homes(id) on delete set null,
  name text not null default '',
  inputs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists wishlists_owner_idx
  on public.wishlists (owner_id, is_active);
create index if not exists wishlist_requirements_wishlist_idx
  on public.wishlist_requirements (wishlist_id, position);
create index if not exists property_details_owner_idx
  on public.property_details (owner_id);
create index if not exists budget_scenarios_owner_idx
  on public.budget_scenarios (owner_id);
create index if not exists property_tours_property_idx
  on public.property_tours (property_id, scheduled_date);

alter table public.profiles enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_requirements enable row level security;
alter table public.property_details enable row level security;
alter table public.property_tours enable row level security;
alter table public.budget_scenarios enable row level security;

-- Shared-workspace access for the current no-login app. Replace these with
-- the auth policies at the bottom of this file when Supabase Auth is enabled.
drop policy if exists "shared access" on public.profiles;
create policy "shared access" on public.profiles
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.wishlists;
create policy "shared access" on public.wishlists
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.wishlist_requirements;
create policy "shared access" on public.wishlist_requirements
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.property_details;
create policy "shared access" on public.property_details
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.property_tours;
create policy "shared access" on public.property_tours
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.budget_scenarios;
create policy "shared access" on public.budget_scenarios
  for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.wishlists,
  public.wishlist_requirements,
  public.property_details,
  public.property_tours,
  public.budget_scenarios
to anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- AUTH-READY POLICIES (optional)
--
-- Enable anonymous sign-ins or email auth in Supabase, then run the block
-- below instead of the shared policies above. The app must send the
-- authenticated user's id as owner_id.
-- ---------------------------------------------------------------------------
--
-- drop policy if exists "shared access" on public.wishlists;
-- create policy "own wishlists" on public.wishlists
--   for all to authenticated
--   using (owner_id = auth.uid()::text)
--   with check (owner_id = auth.uid()::text);
--
-- drop policy if exists "shared access" on public.wishlist_requirements;
-- create policy "own requirements" on public.wishlist_requirements
--   for all to authenticated
--   using (
--     owner_id = auth.uid()::text
--     and exists (
--       select 1 from public.wishlists w
--       where w.id = wishlist_id and w.owner_id = auth.uid()::text
--     )
--   )
--   with check (
--     owner_id = auth.uid()::text
--     and exists (
--       select 1 from public.wishlists w
--       where w.id = wishlist_id and w.owner_id = auth.uid()::text
--     )
--   );
--
-- drop policy if exists "shared access" on public.property_details;
-- create policy "own property details" on public.property_details
--   for all to authenticated
--   using (owner_id = auth.uid()::text)
--   with check (owner_id = auth.uid()::text);
--
-- drop policy if exists "shared access" on public.budget_scenarios;
-- create policy "own budget scenarios" on public.budget_scenarios
--   for all to authenticated
--   using (owner_id = auth.uid()::text)
--   with check (owner_id = auth.uid()::text);
--
-- drop policy if exists "shared access" on public.property_tours;
-- create policy "own tours" on public.property_tours
--   for all to authenticated
--   using (owner_id = auth.uid()::text)
--   with check (owner_id = auth.uid()::text);
