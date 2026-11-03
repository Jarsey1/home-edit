# Staging Environment Status

Configured November 3, 2026.

## Live staging

- Worker: `home-edit-staging`
- URL: `https://home-edit-staging.jarsey1.workers.dev`
- GitHub branch: `develop`
- Displayed environment: **Staging**
- Current deployed commit: `4a53bd8`
- Version: `2.1.0`

## Staging Supabase

- Project ref: `bdrzhobnfxjgjaquwctu`
- URL: `https://bdrzhobnfxjgjaquwctu.supabase.co`
- `account_snapshots` table exists.
- Email authentication is enabled.
- Google authentication is currently **not enabled** in the staging project. Use email/password for staging until it is configured.

Staging must never use the production Supabase URL or key.

## Cloudflare Worker variables

Set on `home-edit-staging`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://bdrzhobnfxjgjaquwctu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging publishable key>
NEXT_PUBLIC_APP_ENV=staging
```

`RENTCAST_API_KEY` is not configured on staging. Property lookup falls back to
the free sources; add a staging/test RentCast secret if needed.

## GitHub staging deployment

`.github/workflows/deploy-staging.yml` deploys `develop` to the staging Worker.

Required repository variables:

```text
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
CLOUDFLARE_ACCOUNT_ID
STAGING_DEPLOY_ENABLED
```

Required repository secret:

```text
CLOUDFLARE_API_TOKEN
```

Set `STAGING_DEPLOY_ENABLED=true` only after the Cloudflare API token exists.
Until then, manual deploys are:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://bdrzhobnfxjgjaquwctu.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging publishable key> \
NEXT_PUBLIC_APP_ENV=staging \
npm run build:cloudflare

npx wrangler deploy --config wrangler.staging.jsonc \
  --var "NEXT_PUBLIC_SUPABASE_URL:https://bdrzhobnfxjgjaquwctu.supabase.co" \
  --var "NEXT_PUBLIC_SUPABASE_ANON_KEY:<staging publishable key>" \
  --var "NEXT_PUBLIC_APP_ENV:staging"
```

## Supabase Auth URL configuration

For the staging project, use:

**Site URL**

```text
https://home-edit-staging.jarsey1.workers.dev
```

**Redirect URLs**

```text
https://home-edit-staging.jarsey1.workers.dev
https://home-edit-staging.jarsey1.workers.dev/**
http://localhost:3000
http://localhost:3000/**
```

Do not put two URLs in the Site URL field.

## Access restriction

The staging Worker is publicly reachable on `workers.dev`. Before adding real
tester data, attach a custom hostname and enable Cloudflare Access, or limit
staging accounts to authorized testers. Staging Supabase data is RLS-protected,
but the app shell itself is public.
