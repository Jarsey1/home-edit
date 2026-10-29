-- The Next Home Edit — V2.1
-- Guided evaluations and explicit budget-estimate confirmation.
-- Additive: run after 0002_v2.sql. No existing rows are changed or deleted.

begin;

create table if not exists public.property_evaluations (
  id text primary key,
  owner_id text not null default 'shared',
  home_id text not null references public.homes(id) on delete cascade,
  wishlist_id text not null references public.wishlists(id) on delete cascade,
  requirement_id text not null references public.wishlist_requirements(id) on delete cascade,
  state text not null check (state in ('met', 'not-met')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (home_id, wishlist_id, requirement_id)
);

create index if not exists property_evaluations_owner_idx
  on public.property_evaluations (owner_id);
create index if not exists property_evaluations_home_idx
  on public.property_evaluations (home_id, wishlist_id);

alter table public.budget_scenarios
  add column if not exists confirmed boolean not null default false;

alter table public.property_evaluations enable row level security;

drop policy if exists "shared access" on public.property_evaluations;
create policy "shared access" on public.property_evaluations
  for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.property_evaluations
to anon, authenticated;

commit;

-- AUTH-READY POLICY (optional, after enabling Supabase Auth)
-- drop policy if exists "shared access" on public.property_evaluations;
-- create policy "own evaluations" on public.property_evaluations
--   for all to authenticated
--   using (owner_id = auth.uid()::text)
--   with check (owner_id = auth.uid()::text);
