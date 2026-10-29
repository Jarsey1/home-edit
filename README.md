# The Next Home Edit

A mobile-first house-hunting PWA: one shared shortlist of homes, a wishlist,
side-by-side comparisons, tour notes, a budget planner and neighborhood notes.

Built with Next.js (App Router), React, Tailwind CSS and Supabase.

## What you need

- Node.js 20+
- A Supabase project (free tier is fine)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from the example and add your project keys:

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

   Find both in Supabase → **Project Settings → API**. The publishable/anon key
   is designed to be public; access is controlled by row-level security.

3. Create the tables. In Supabase, open **SQL Editor → New query**, paste the
   contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   and run it. It creates five tables and permissive policies for the shared
   dataset.

4. Start the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. The app seeds starter homes, wishlist items,
   tour notes and budget settings on first load, so the screens are populated
   immediately.

## How data works

- Every device points at the same Supabase project, so the dataset is shared.
- There is **no login**. The anon/publishable key can read and write all rows.
  Keep the deployment private, or add Supabase Auth before sharing it widely.
- If `.env.local` is missing or Supabase is unreachable, the app falls back to
  `localStorage` and keeps working on that device. The More screen shows whether
  data is synced or device-only.
- Tables: `homes`, `wishlist_items`, `tour_notes`, `budget_settings`,
  `comparison_notes`.

## Adding a home

Tap the **+** button on the Dashboard. Optionally choose a state first to narrow
the lookup, then start typing a street address. As you type, the app asks its
own `/api/address-search` route for suggestions and shows the closest matches.
Pick one to fill in the street and city automatically, or keep typing and submit
the address manually if it is not listed.

Price, beds, baths and square footage are optional. New homes are saved to the
shortlist by default and appear in Compare Homes and the rest of the app. Homes
without a price or specs show friendly placeholders (`Price TBD`, `—`, `New`)
until you fill them in later.

Address suggestions come from [Photon](https://photon.komoot.io/), an
OpenStreetMap-based geocoder. It is free and does not need an API key. When a
state is selected, the route adds the state name to the Photon query, filters
the ranked results down to that state, and retries the plain query if nothing
matches. Results are cached in memory for 10 minutes by the route handler; if
the service is unreachable, manual address entry still works.

## Working from another laptop

```bash
git clone <your-repo-url>
cd next-home-edit
npm install
```

Then create `.env.local` again with the same URL and key (it is intentionally
not committed), and run `npm run dev`.

## Scripts

```bash
npm run dev    # development server (LAN + PWA friendly)
npm run build  # production build
npm run lint   # eslint
```

## Install on iPhone

1. Open the app in Safari.
2. Tap **Share → Add to Home Screen**.
3. Launch it from the home screen for the full-screen PWA experience.

The app is responsive from 375px up and uses safe-area insets on notched
devices.

## Project layout

```
app/
  page.tsx                  screen + overlay navigation
  layout.tsx                fonts, metadata, data provider
  lib/
    supabase.ts             client (null when unconfigured)
    app-data.tsx            shared state, Supabase reads/writes, fallback
    homes.ts                Home type, formatting, demo homes
    defaults.ts             starter data
    types.ts                persisted record types
  api/
    address-search/         Photon-backed address suggestions
  components/
    dashboard.tsx
    screens/                all eight screens + Add Home
supabase/migrations/        SQL schema + policies
```
