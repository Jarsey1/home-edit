# Deploy to Cloudflare Workers

This project uses the OpenNext Cloudflare adapter to run the existing Next.js
app on Cloudflare Workers. The app no longer depends on the Mac being awake.

## Local verification

```bash
npm run build:cloudflare
npm run preview:cloudflare
```

The Worker preview runs on `http://localhost:8787`.

## Cloudflare Workers Builds settings

In **Cloudflare → Workers & Pages → Create an application → Connect to Git**:

- Repository: `Jarsey1/home-edit`
- Branch: `v2.1` (or merge it into `main` first)
- Project name: `home-edit`
- Build command: `npm run build:cloudflare`
- Deploy command: `npx wrangler deploy`
- Preview builds: turn off until the production deployment is verified
- Root directory: leave empty

Do **not** use the default `npm run build` build command by itself. OpenNext
must generate the Worker bundle before `wrangler deploy` runs.

## Environment variables

Add these as **build variables** before the first deploy:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_PRICE_WARNING_THRESHOLD   # optional
```

Add the same public variables to the Worker’s runtime variables, plus this
server-only secret for the property lookup API:

```text
RENTCAST_API_KEY
```

Never add a Supabase service-role key.

Changing `NEXT_PUBLIC_*` variables requires a new build.

## After deployment

Cloudflare gives you a URL such as:

```text
https://home-edit.<your-subdomain>.workers.dev
```

Add it to Supabase **Authentication → URL Configuration**:

```text
https://home-edit.<your-subdomain>.workers.dev
https://home-edit.<your-subdomain>.workers.dev/**
```

Google OAuth can optionally add the same HTTPS origin to Authorized JavaScript
origins, but the Supabase callback remains:

```text
https://upkiivhuxgvrjtkorvbi.supabase.co/auth/v1/callback
```

Then sign in on the deployed URL and add it to the iPhone home screen.

## Next.js compatibility notes

`cacheComponents` and `partialPrefetching` were removed because OpenNext and
the Workers runtime did not serve requests with those Next 16 experiments
enabled. The language cookie still renders the correct `<html lang>` because
the layout reads it with `cookies()`.

## Commands

```bash
npm run build:cloudflare     # Next.js + OpenNext worker bundle
npm run deploy:cloudflare    # build and deploy locally with Wrangler
npm run cf-typegen           # optional Worker env types
```

For CLI deploys, run `npx wrangler login` once.
