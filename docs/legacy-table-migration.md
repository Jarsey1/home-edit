# Legacy Shared-Table Migration

The app now stores signed-in homes, notes and budget data in the private
account snapshot. The old shared tables still need a database migration to
close anonymous API access and isolate the existing rows.

Migration file:

```text
supabase/migrations/0005_private_legacy_owner.sql
```

It does not delete rows. It adds `owner_id` to:

- `homes`
- `wishlist_items`
- `tour_notes`
- `budget_settings`
- `comparison_notes`

Existing rows are assigned to the `jarsey1@gmail.com` account. New accounts do
not receive those rows.

## Before running

1. Export or back up the five legacy tables from Supabase.
2. Confirm the owner account exists in Authentication → Users.
3. If the owner email changes, update the email in the migration first.

## Staging

1. Open the **home-edit-staging** project.
2. SQL Editor → New query.
3. Paste the migration and run it.
4. Verify with the staging publishable key:
   - `GET /rest/v1/homes` as anonymous returns `401/403` or no rows.
   - `POST /rest/v1/homes` as anonymous is rejected.
   - A second signed-in account cannot read the owner’s rows.
5. Open the staging app and confirm the owner still sees their homes through
   the account snapshot.

## Production

Repeat after staging is verified and production release is approved. Do not
run it on production and staging simultaneously.

## Rollback

The migration does not remove columns or rows. If rollback is required:

- Drop the new owner policies.
- Recreate the previous `shared access` policies.
- Restore anonymous grants only if intentionally returning to the insecure
  shared design.
- Keep the backup until the production verification is complete.
