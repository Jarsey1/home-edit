-- Private property photos.
--
-- Photos are compressed on the device, uploaded to
-- property-photos/<user-id>/<home-id>/cover.jpg, and read through short-lived
-- signed URLs. The account snapshot stores only the object path.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-photos',
  'property-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Each user can only touch objects inside their own first-level folder.
drop policy if exists "property photos read own" on storage.objects;
create policy "property photos read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property photos insert own" on storage.objects;
create policy "property photos insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property photos update own" on storage.objects;
create policy "property photos update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property photos delete own" on storage.objects;
create policy "property photos delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
