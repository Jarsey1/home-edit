-- Secure account snapshot sync for The Next Home Edit.
--
-- This intentionally does NOT use the legacy shared tables from 0002/0003.
-- Each signed-in user gets one private snapshot row containing their
-- wishlists, requirements, property details, budget scenarios and
-- evaluations. Row Level Security restricts every row to auth.uid().
--
-- Apply this migration in the Supabase SQL editor after enabling Email Auth.
-- Do not put the service-role key in the frontend.

create table if not exists public.account_snapshots (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.account_snapshots enable row level security;

drop policy if exists "account snapshot select own" on public.account_snapshots;
create policy "account snapshot select own"
  on public.account_snapshots
  for select
  using (owner_id = auth.uid());

drop policy if exists "account snapshot insert own" on public.account_snapshots;
create policy "account snapshot insert own"
  on public.account_snapshots
  for insert
  with check (owner_id = auth.uid());

drop policy if exists "account snapshot update own" on public.account_snapshots;
create policy "account snapshot update own"
  on public.account_snapshots
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "account snapshot delete own" on public.account_snapshots;
create policy "account snapshot delete own"
  on public.account_snapshots
  for delete
  using (owner_id = auth.uid());
