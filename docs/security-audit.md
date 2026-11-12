# Security Audit and Account Settings

Inspected: November 3, 2026

## Authentication

- Supabase Auth is used through `@supabase/supabase-js`.
- Google OAuth is enabled in production and staging. Production and staging
  use separate Supabase projects and callbacks.
- Email/password is enabled. Staging email confirmation is enabled.
- Session persistence and token refresh are enabled in `app/lib/supabase.ts`.
- Sign-out calls `supabase.auth.signOut()` and stops account snapshot sync.
- Password reset sends a Supabase recovery email. The new
  `/reset-password` page calls `updateUser({ password })` after the recovery
  session is established.
- Expired sessions are handled by the Supabase client; protected operations
  fail and show an error instead of silently claiming success.
- OAuth returns use `window.location.origin`, so production returns to the
  production Worker and staging returns to the staging Worker.

## Ownership and RLS

The private per-account data model is the `account_snapshots` table:

- Primary key: `owner_id uuid references auth.users(id) on delete cascade`.
- Payload: wishlists, requirements, property details, photos, budget scenarios
  and evaluations as one JSON document per user.
- RLS is enabled with select/insert/update/delete policies requiring
  `owner_id = auth.uid()`.

Verified against production and staging:

- Anonymous select returns an empty list.
- Anonymous insert is rejected with `42501` row-level security violation.

The account snapshot is therefore private per authenticated user.

## Known shared data (not migrated)

These legacy tables are still part of the original single-household design and
are **not** fully isolated per user:

- `homes` — shared saved properties.
- `wishlist_items` — legacy checklist used only to seed V2 data.
- `tour_notes` and `comparison_notes` — legacy shared notes. Signed-in note
  writes now stay in the private account snapshot; legacy shared rows can still
  be read during the first account seed.
- `budget_settings` — legacy shared budget defaults. Signed-in budget changes
  now stay in the private account snapshot.

No shared row was migrated into a personal account. No RLS policy on those
tables was changed.

For private beta with multiple unrelated users, these tables are a blocker.
The next secure migration is to move homes, notes and budget settings into
user-owned rows or into the already-private account snapshot.

## Property photographs

Photos are compressed data URLs inside `property_details.photo`, which is part
of the private account snapshot. They are protected by account RLS, but they
are **not** in Supabase Storage yet.

A Storage migration is still required for the final architecture:

- Private `property-photos` bucket.
- Object path `<user-id>/<home-id>/<photo-id>`.
- Storage policies using `(storage.foldername(name))[1] = auth.uid()::text`.
- Signed URLs for reads.
- File size and MIME restrictions.

Until then, photos are private through the snapshot but use database bandwidth
rather than a CDN.

## Secrets and configuration

- The publishable/anon key is the only Supabase key in the browser.
- `.env.local` is ignored by Git.
- No service-role key is used in client code.
- Account deletion is the only privileged operation and runs in
  `/api/account/delete` using `SUPABASE_SERVICE_ROLE_KEY` from the Worker
  runtime.
- The service-role key must never be placed in `NEXT_PUBLIC_*`.
- The Cloudflare API token used for staging deployment was exposed during setup
  and must be rotated.

## Account deletion

`POST /api/account/delete`:

1. Requires a current Supabase access token.
2. Verifies the token server-side.
3. Calls `auth.admin.deleteUser`.
4. The `account_snapshots.owner_id` foreign-key cascade removes the user’s
   private snapshot, including wishlists, facts, photos, scenarios and
   evaluations.
5. The UI requires typing `DELETE` and reports failure without claiming success.

The route returns `503` until `SUPABASE_SERVICE_ROLE_KEY` is configured in the
Worker. Account deletion has **not** been tested with a disposable account yet
because that secret is not present in staging.

## Authentication-first gate and onboarding

- Unauthenticated visitors see only the welcome/login screen. Dashboard,
  wishlists, homes, comparisons, budget, evaluations, notes and photos are not
  mounted.
- Returning sessions open the app directly.
- A newly authenticated account with no snapshot receives an empty workspace:
  no shared homes, no demo wishlist and no seeded preferences.
- The onboarding screen offers **Create My Wishlist** or **Explore the App**.
  Both create a blank wishlist without importing shared test records.
- Signed-in home writes no longer go to the shared `homes` table; the private
  home list is stored in the account snapshot.

## Account Settings

**More → Settings** now provides:

- Display name.
- Email.
- Authentication provider.
- Sign out.
- Password reset for accounts with an email identity.
- Permanent account deletion.
- English/Spanish preference.
- Privacy Policy, Terms of Service and Contact Support links when configured.

If `NEXT_PUBLIC_PRIVACY_URL`, `NEXT_PUBLIC_TERMS_URL` or
`NEXT_PUBLIC_SUPPORT_EMAIL` are missing, Settings shows “Not published yet” and
marks publication as a launch blocker.

## Cities to Avoid

Cities are stored per wishlist as `excludedCities` with a stable
`city|state|country` key. Scoring uses one synthetic dealbreaker requirement
created from the active wishlist; it does not add a second scoring system.

- Verified city match → disqualified by location.
- Missing/ambiguous state or region → location needs verification, not a
  failure.
- Removing an exclusion recalculates scores.
- Different wishlists keep separate exclusion lists.

## Remaining security concerns

1. Shared `homes`, tour notes, comparison notes and budget settings are still
   visible across accounts.
2. Photos are private via RLS but not in Supabase Storage.
3. Account deletion needs a staging service-role secret and a disposable-account
   test.
4. Two independent user accounts have not yet been tested against RLS because
   staging requires email confirmation and no disposable credentials were
   created.
5. Rate limiting relies on Supabase/Cloudflare defaults; no custom abuse
   thresholds are implemented.
6. Privacy Policy, Terms of Service and a support contact are not published.

These must be resolved or explicitly accepted before opening private beta to
unrelated users.
