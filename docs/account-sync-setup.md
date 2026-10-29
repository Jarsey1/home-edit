# Account Sync Setup

The app supports secure cross-device sync for wishlists, property details,
budget scenarios and evaluations. It stores one private snapshot row per
signed-in user. Each row is protected by Row Level Security and can only be
read or written by `auth.uid()`.

The application does **not** use the legacy shared `wishlist_items` table and
never receives a service-role key.

## 1. Enable Email authentication

In the Supabase dashboard:

1. Open **Authentication → Providers**.
2. Enable **Email**.
3. Decide whether **Confirm email** is on. If it is on, the user must confirm
   the account email before signing in.

## 2. Apply the migration

Open the Supabase **SQL Editor** and run:

```text
supabase/migrations/0004_account_snapshots.sql
```

This creates `public.account_snapshots` and its four per-user RLS policies.
It does not modify or delete the existing `homes`, `wishlist_items`, tour notes
or comparison notes.

## 3. Seed the account from the device that has the correct data

Do this first on the browser where the wishlist is correct:

1. Open **More → Account**.
2. Enter an email and password and choose **Create account**.
3. Confirm the email if required, then **Sign in**.
4. The first sign-in uploads the current local wishlist, property details and
   evaluations to the account snapshot.

The More screen should show **Synced to your account**, and Wishlist should say
that data syncs to the account.

## 4. Sign in on the iPhone home-screen app

Open the home-screen app, go to **More → Account**, and sign in with the same
email and password. If confirmation is enabled, confirm the email first in a
browser, then return to the app and sign in.

The app downloads the account snapshot and replaces the device-local wishlist
data. The iPhone's old local data is not deleted from the account; it is simply
replaced locally by the account copy.

## 5. Verify

- Change a Must-Have on the browser. After about one second, reload or reopen
  the iPhone app and confirm the change appears.
- Change a property fact in Missing Information and confirm it appears on the
  other device.
- More should show **Synced to your account** on both devices.
- If the network fails, More and Wishlist show that changes remain on the
  device; the local mirror is always updated.

## Important behavior

- **Last write wins.** There is no merge conflict UI. Avoid editing the same
  fields on both devices at the same time.
- The snapshot includes compressed property photos because they are part of the
  existing property-details model.
- Signing out stops account sync but leaves the last downloaded copy on the
  device.
- If `0004_account_snapshots.sql` has not been applied, sign-in succeeds but
  account sync reports that changes remain on the device.
- The legacy `0002_v2.sql`/`0003_evaluations.sql` shared-owner tables are not
  required for account sync and should not be used for private data.
