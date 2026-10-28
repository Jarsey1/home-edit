-- The Next Home Edit — initial schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → Run.
--
-- The app has no login. These policies intentionally allow the public
-- (publishable/anon) key to read and write this single shared dataset.
-- Keep the deployment private, or add Supabase Auth before sharing it.

create table if not exists public.homes (
  id text primary key,
  address text not null,
  city text not null,
  price numeric not null default 0,
  match integer not null default 0,
  beds integer not null default 0,
  baths numeric not null default 0,
  sqft integer not null default 0,
  lot text not null default '',
  garage text not null default '',
  pool boolean not null default false,
  gated boolean not null default false,
  hoa numeric not null default 0,
  year_built integer not null default 0,
  type text not null default 'Single family',
  days_on_market integer not null default 0,
  image_filter text not null default 'none',
  description text not null default '',
  features text[] not null default '{}',
  saved boolean not null default false,
  tour_requested boolean not null default false,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id text primary key,
  kind text not null check (kind in ('category', 'must', 'nice')),
  category text,
  label text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tour_notes (
  home_id text primary key references public.homes(id) on delete cascade,
  rating integer not null default 0 check (rating between 0 and 5),
  notes text not null default '',
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_settings (
  id integer primary key default 1 check (id = 1),
  price numeric not null default 1250000,
  down_percent numeric not null default 20,
  term integer not null default 30,
  rate numeric not null default 6.5,
  updated_at timestamptz not null default now()
);

create table if not exists public.comparison_notes (
  id text primary key,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.homes enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.tour_notes enable row level security;
alter table public.budget_settings enable row level security;
alter table public.comparison_notes enable row level security;

drop policy if exists "shared access" on public.homes;
create policy "shared access" on public.homes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.wishlist_items;
create policy "shared access" on public.wishlist_items
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.tour_notes;
create policy "shared access" on public.tour_notes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.budget_settings;
create policy "shared access" on public.budget_settings
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "shared access" on public.comparison_notes;
create policy "shared access" on public.comparison_notes
  for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.homes,
  public.wishlist_items,
  public.tour_notes,
  public.budget_settings,
  public.comparison_notes
to anon, authenticated;

-- The app seeds its starter homes, wishlist, notes and budget on first load.
