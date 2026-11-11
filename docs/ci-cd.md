# CI/CD and Environment Setup

Last inspected: November 2, 2026

## Current infrastructure

| Item | Current state |
| --- | --- |
| GitHub repository | `Jarsey1/home-edit` (public) |
| Default branch | `main` |
| Production branch | `main` |
| Production Worker | `home-edit` at `https://home-edit.jarsey1.workers.dev` |
| Production hosting | Cloudflare Workers + OpenNext |
| Production deployment | Cloudflare GitHub integration from `main` |
| Staging Worker | `home-edit-staging` at `https://home-edit-staging.jarsey1.workers.dev` |
| Supabase production | Project `upkiivhuxgvrjtkorvbi`; account snapshot sync via `0004_account_snapshots.sql` |
| Supabase staging | Project `bdrzhobnfxjgjaquwctu`; `account_snapshots` exists; email auth enabled |
| Authentication | Email/password and Google OAuth |
| Tests | Vitest: 89 tests; ESLint; `tsc --noEmit`; Next/OpenNext production build |
| CI/CD before this setup | No GitHub Actions or required checks; branch protection was applied during setup |
| Build information | Added to More → About; injected at build time |

Production currently deploys automatically after a push or merge to `main`.
Do not merge to `main` until the branch protection and staging setup below are
reviewed.

## Branching model

```text
feature/<task>  ->  develop  ->  main
```

- **main** — production only. Protected; pull request + CI + manual merge approval.
- **develop** — integration and staging. Deploys to the staging Worker.
- **feature branches** — created from `develop`, one task each.
- `v2.1` is retained as a historical branch but is no longer a deployment
  branch.

Create a feature branch:

```bash
git checkout develop
git pull
git checkout -b feature/my-change
```

## GitHub branch protection

Configure this in **GitHub → Settings → Branches** (public repository, free).

### `main`

- Require a pull request before merging.
- Require a pull request. This single-owner repository uses **0 required approvals** so the owner is not locked out; the product-owner approval is the explicit merge action. If a second GitHub reviewer is added, raise this to **1 approval**.
- Dismiss stale approvals when new commits are pushed.
- Require the **CI / Lint, typecheck, test and build** status check.
- Require conversation resolution.
- Block force pushes.
- Block deletions.
- Do not allow bypassing the rules for normal developers.

### `develop`

- Require the same CI status check.
- Block force pushes and deletions.
- A pull request is recommended but optional for a single developer.

Production approval is therefore the PR approval before merge. Cloudflare
deploys `main` after the approved merge.

## Cloudflare staging Worker

Create a second Worker; do not duplicate the production Worker.

1. **Workers & Pages → Create application → Connect to Git**.
2. Repository: `Jarsey1/home-edit`.
3. Project name: `home-edit-staging`.
4. After creation, open **Settings → Build → Branch control** and set the
   production branch to **`develop`**.
5. Build command:

   ```text
   npm run build:cloudflare:checked
   ```

   This runs lint, typecheck and tests before the OpenNext build. A failing
   test stops the staging deployment.

6. Deploy command:

   ```text
   npx wrangler deploy --config wrangler.staging.jsonc
   ```

7. Disable Preview builds until the staging Worker is verified.
8. Set the staging environment variables in **Settings → Build** and
   **Settings → Variables and Secrets**.

Staging URL:

```text
https://home-edit-staging.jarsey1.workers.dev
```

`wrangler.staging.jsonc` uses the separate Worker name
`home-edit-staging`. It does not modify production.

### Restricting staging access

The staging Worker is public on `workers.dev`, so protect it before adding real
data:

- Preferred: attach a custom hostname such as `staging.example.com` and place
  it behind **Cloudflare Access** (free for up to 50 users).
- Without a custom domain: use a dedicated staging Supabase project and only
  create accounts for authorized testers. The shell is public, but account data
  remains protected by Supabase Auth and RLS.

Do not put production Supabase credentials in staging.

## Supabase staging project

Create a new Supabase project for staging.

1. Create the project in the same organization.
2. Run `supabase/migrations/0004_account_snapshots.sql`.
3. Enable the Email provider.
4. Configure Google OAuth with a **separate staging redirect URL** if desired.
5. Add the staging Worker URL to **Authentication → URL Configuration**:

   ```text
   https://home-edit-staging.jarsey1.workers.dev
   https://home-edit-staging.jarsey1.workers.dev/**
   ```

6. Create staging tester accounts.
7. Add the staging project URL and publishable key only to the staging Worker.

Staging and production must never share the same Supabase project. Do not copy
production rows into staging without review or anonymization.

## Environment variables

| Variable | Production | Staging | Build time | Runtime |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production project URL | Staging project URL | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production publishable key | Staging publishable key | Yes | Yes |
| `NEXT_PUBLIC_APP_ENV` | `production` | `staging` | Yes | No |
| `RENTCAST_API_KEY` | Production RentCast key | Staging/test key | No | Yes (secret) |
| `NEXT_PUBLIC_PRICE_WARNING_THRESHOLD` | Optional | Optional | Yes | Yes |
| `NEXT_PUBLIC_BUILD_COMMIT` | Optional override | Optional override | Yes | No |
| `NEXT_PUBLIC_BUILD_TIME` | Optional override | Optional override | Yes | No |

`NEXT_PUBLIC_*` values are embedded at build time. Changing them requires a new
build. Never place a Supabase service-role key or database password in the
frontend.

`next.config.ts` automatically uses the Cloudflare commit SHA when available
and generates the build timestamp. `NEXT_PUBLIC_APP_ENV` must still be set per
Worker.

## CI workflow

`.github/workflows/ci.yml` runs on pull requests to `main` or `develop` and on
pushes to `develop` and `feature/**`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build:cloudflare`

A failed step blocks the pull request. The Cloudflare staging build uses
`build:cloudflare:checked`, which repeats the checks before deploying.

## Build information

**More → About** displays:

- Environment (Production / Staging / Development)
- Application version from `package.json`
- Git commit from the Cloudflare/GitHub build environment
- Build timestamp in UTC

No deployment date is hardcoded.

## Production release process

1. Work on `feature/<task>` from `develop`.
2. Open a PR to `develop`; CI must pass.
3. Merge to `develop`; Cloudflare builds and deploys staging.
4. Test staging on the iPhone.
5. Confirm production is unchanged.
6. Open a PR from `develop` to `main`.
7. Obtain product-owner approval and pass required checks.
8. Merge; Cloudflare deploys production.

Do not push directly to `main` or deploy production from a laptop.

## Rollback

### Cloudflare

1. Open **Workers & Pages → home-edit → Deployments**.
2. Select the previous known-good version.
3. Use **Rollback** / **Promote** from the version menu.
4. Verify **More → About** shows the expected commit.

CLI alternative:

```bash
npx wrangler deployments list --name home-edit
npx wrangler rollback <version-id> --name home-edit
```

### Git

1. Open a revert PR against `main` for the bad merge.
2. Let CI pass.
3. Merge after approval; Cloudflare deploys the reverted code.
4. Do not force-push `main`.

### Database

- Take a Supabase backup/snapshot before any schema migration.
- Test migrations on staging first.
- Do not automatically roll back migrations. Review the recovery SQL and restore
  from a verified backup only with approval.
- Account snapshots are one JSON row per user; a restore must not overwrite a
  newer user snapshot without checking timestamps.

### Verify recovery

- Worker URL opens.
- More → About shows the expected commit/environment.
- Sign-in works.
- Wishlist, property details and evaluations load.
- Production data counts match the pre-release check.

## Estimated costs

- **GitHub Actions:** free for this public repository (standard runners).
- **Cloudflare Workers Free:** sufficient for this app; current bundle is about
  1.4 MiB gzip. Paid Workers plan is about $5/month if usage grows.
- **Supabase Free:** two projects are available on the free tier. Paid plan is
  about $25/month per organization if limits are exceeded.
- **Cloudflare Access:** free for up to 50 users.
- **Domain:** only needed for a branded staging/production hostname.

No paid service is required for the initial setup.

## Manual setup checklist

- [x] Create `develop` branch (done in repository).
- [x] Protect `main` and `develop` as described above.
- [x] Create the `home-edit-staging` Worker and deploy `develop` manually.
- [x] Create the staging Supabase project and run `0004`.
- [x] Add staging Worker variables and GitHub staging variables.
- [ ] Set production `NEXT_PUBLIC_APP_ENV=production`.
- [ ] Change the production build command to
      `npm run build:cloudflare:checked`.
- [ ] Verify the staging URL and wildcard are saved correctly in staging Supabase.
- [ ] Restrict staging access if using real tester data.
- [ ] Add `CLOUDFLARE_API_TOKEN` and set `STAGING_DEPLOY_ENABLED=true`.
- [ ] Run the full verification workflow below.

## Full workflow verification

1. Create a small feature branch change.
2. Push it; CI must run.
3. Open a PR to `develop`; merge after checks.
4. Confirm a staging deployment appears and the staging URL updates.
5. Open staging on the iPhone and verify About shows `staging` and the new commit.
6. Confirm production still shows the previous commit and is unchanged.
7. Approve and merge `develop` to `main`.
8. Confirm production deploys and About shows the new commit.
9. Follow the rollback section once in a non-production drill.
