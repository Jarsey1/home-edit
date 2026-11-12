-- Secure the original shared tables before private beta.
--
-- Existing rows are assigned to the existing owner account. New accounts do
-- not receive these rows. The app now stores signed-in homes, notes and budget
-- data in the private account snapshot.
--
-- BACK UP the five legacy tables before running this migration.
-- Run it on staging first, then production after approval.

do $$
declare
  owner uuid;
begin
  select id into owner
  from auth.users
  where lower(email) = lower('jarsey1@gmail.com')
  limit 1;

  if owner is null then
    raise exception 'Owner account jarsey1@gmail.com was not found';
  end if;

  alter table public.homes add column if not exists owner_id uuid;
  alter table public.wishlist_items add column if not exists owner_id uuid;
  alter table public.tour_notes add column if not exists owner_id uuid;
  alter table public.budget_settings add column if not exists owner_id uuid;
  alter table public.comparison_notes add column if not exists owner_id uuid;

  update public.homes set owner_id = owner where owner_id is null;
  update public.wishlist_items set owner_id = owner where owner_id is null;
  update public.tour_notes set owner_id = owner where owner_id is null;
  update public.budget_settings set owner_id = owner where owner_id is null;
  update public.comparison_notes set owner_id = owner where owner_id is null;

  alter table public.homes alter column owner_id set default auth.uid();
  alter table public.wishlist_items alter column owner_id set default auth.uid();
  alter table public.tour_notes alter column owner_id set default auth.uid();
  alter table public.budget_settings alter column owner_id set default auth.uid();
  alter table public.comparison_notes alter column owner_id set default auth.uid();

  alter table public.homes alter column owner_id set not null;
  alter table public.wishlist_items alter column owner_id set not null;
  alter table public.tour_notes alter column owner_id set not null;
  alter table public.budget_settings alter column owner_id set not null;
  alter table public.comparison_notes alter column owner_id set not null;
end $$;

create index if not exists homes_owner_idx on public.homes (owner_id);
create index if not exists wishlist_items_owner_idx on public.wishlist_items (owner_id);
create index if not exists tour_notes_owner_idx on public.tour_notes (owner_id);
create index if not exists comparison_notes_owner_idx on public.comparison_notes (owner_id);

alter table public.homes enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.tour_notes enable row level security;
alter table public.budget_settings enable row level security;
alter table public.comparison_notes enable row level security;

drop policy if exists "shared access" on public.homes;
drop policy if exists "shared access" on public.wishlist_items;
drop policy if exists "shared access" on public.tour_notes;
drop policy if exists "shared access" on public.budget_settings;
drop policy if exists "shared access" on public.comparison_notes;

drop policy if exists "owner access" on public.homes;
create policy "owner access" on public.homes
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owner access" on public.wishlist_items;
create policy "owner access" on public.wishlist_items
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owner access" on public.tour_notes;
create policy "owner access" on public.tour_notes
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owner access" on public.budget_settings;
create policy "owner access" on public.budget_settings
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owner access" on public.comparison_notes;
create policy "owner access" on public.comparison_notes
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

revoke all on public.homes from anon;
revoke all on public.wishlist_items from anon;
revoke all on public.tour_notes from anon;
revoke all on public.budget_settings from anon;
revoke all on public.comparison_notes from anon;

grant select, insert, update, delete on public.homes to authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;
grant select, insert, update, delete on public.tour_notes to authenticated;
grant select, insert, update, delete on public.budget_settings to authenticated;
grant select, insert, update, delete on public.comparison_notes to authenticated;
