# The Next Home Edit

A mobile-first house-hunting PWA: one shared shortlist of homes, multiple
wishlists with deterministic match scoring, side-by-side comparisons, tour
notes, property-specific budget plans and neighborhood notes.

Built with Next.js (App Router), React, Tailwind CSS and Supabase.

## What you need

- Node.js 20+
- A Supabase project (free tier is fine)
- Optional: a [RentCast](https://app.rentcast.io/app/api) API key if you want a
  nationwide fallback outside Miami-Dade County

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

   Find the Supabase values in **Project Settings → API**. The
   publishable/anon key is designed to be public; access is controlled by
   row-level security.

   Property details work without any other key. Miami-Dade County publishes
   its parcel roll as an open ArcGIS layer, so beds, baths, square footage, lot
   size and year built are looked up for free. If you also set
   `RENTCAST_API_KEY`, it is used only as a fallback when the free records have
   no match (useful outside Miami-Dade). Leave it out to stay entirely on free
   public records.

3. Create the tables. In Supabase, open **SQL Editor → New query**, paste the
   contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   and run it. It creates the original five tables and permissive policies for
   the shared dataset.

   Then run [`supabase/migrations/0002_v2.sql`](supabase/migrations/0002_v2.sql)
   and [`supabase/migrations/0003_evaluations.sql`](supabase/migrations/0003_evaluations.sql).
   They are additive: they add `profiles`, `wishlists`,
   `wishlist_requirements`, `property_details`, `property_tours`,
   `budget_scenarios` and `property_evaluations`, plus a `confirmed` column on
   budget plans. No existing rows are changed or deleted. If you skip these
   steps, every V2/V2.1 feature still works on this device using
   `localStorage`; it just will not sync between devices.

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
- Original tables: `homes`, `wishlist_items`, `tour_notes`,
  `budget_settings`, `comparison_notes`.
- V2 tables: `profiles`, `wishlists`, `wishlist_requirements`,
  `property_details`, `property_tours`, `budget_scenarios`,
  `property_evaluations`. Facts, photos, personal notes and tour dates live in
  `property_details`; wishlist-specific scores are never stored because they
  are recalculated from facts. Manual evaluation answers live in
  `property_evaluations` and never overwrite the property facts.

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

### Prefilled property details

Picking an address suggestion (or tapping **Look up details** for an address
you typed) asks `/api/property-lookup` for public records. Beds, baths, square
footage, lot size and year built are shown in a small facts table and filled in
only when those fields are still empty. You can edit or clear them before
saving. The price field is **never** prefilled.

The primary source is the free
[Miami-Dade County parcel layer](https://gisweb.miamidade.gov/arcgis/rest/services/MD_LandInformation/MapServer/26),
which needs no key or subscription. It covers Miami-Dade addresses and supplies
bedrooms, bathrooms, living area, lot size and year built. Records can lag new
construction and the last sale price is not the current asking price.

Candidates are matched against the exact house number, street name and suffix,
so a nearby `108th Terrace` can never fill in `108th Street`. Lookups are cached
briefly. If `RENTCAST_API_KEY` is set, RentCast is tried only when the free
county records have no match. Without a key (or with an inactive plan) the app
simply reports that no public records were found and manual entry works as
before.

Facts are saved to Supabase with the home (beds, baths, square footage, lot,
year built, property type and location). The lookup route reads the shared
shortlist first, so any home that already has facts can be filled in again from
Supabase on any device without calling the county. County records only fill gaps
in older or partial rows.

## Removing a home

On the **Homes** tab, each column has a small trash button in the top-left
corner of its photo. Tapping it asks for confirmation, then deletes the home
from the shared list along with its tour notes. The confirmation defaults to
**Keep home**, so an accidental tap does not remove anything. If every home is
removed, the tab shows an empty state with an **Add a Home** button.

## Working from another laptop

```bash
git clone <your-repo-url>
cd next-home-edit
npm install
```

Then create `.env.local` again with the same URL and key (it is intentionally
not committed), and run `npm run dev`.

## Wishlists and match scoring

- A wishlist is an independent set of typed preferences with an optional
  budget. You can create, rename, duplicate, delete (with confirmation) and
  switch the active wishlist.
- Requirements belong to one of eight categories and use one of six
  conditions: yes/no, numeric minimum, numeric maximum, numeric range, text /
  category, or location exclusion.
- Importance is stored separately from the expected value:
  **must-have = 5**, **nice-to-have = 2**, **not important = 0**, and
  **dealbreaker = hard filter**. Any requirement can override its weight.
- Match score = weighted points earned ÷ weighted points evaluated × 100.
  Only evaluated must/nice requirements go in the denominator. Unknown facts
  are never treated as failures.
- Coverage shows how much of the weighted wishlist was actually evaluated.
  A property can show a high score and still be marked “awaiting verification”.
- A confirmed dealbreaker disqualifies a property and is shown separately from
  the percentage. Unknown dealbreakers are never disqualifying.
- Wishlist setup progress counts reviewed/configured preferences. It is
  deliberately separate from property match scores.

The scoring engine is deterministic and lives in
[`app/lib/scoring.ts`](app/lib/scoring.ts). Property facts are derived in
[`app/lib/property-facts.ts`](app/lib/property-facts.ts), so the same home can
be scored against different wishlists without rewriting its listing data.

## Budget planner

The planner starts from the listing price and HOA when opened from a home, then
keeps every assumption in a separate `budget_scenarios` record. Editing a plan
never edits the listing. It uses the standard fixed-rate amortization formula,
handles zero-interest loans, synchronizes down payment percentage and amount,
and shows monthly ownership cost, annual cost, upfront cash and the difference
from a target monthly budget. All figures are estimates, not lender quotes.

## Guided property evaluation (V2.1)

Open a saved home and choose **Evaluate home**, or use the dashboard’s
**Your Next Step** card. The evaluation screen:

- loads the property’s known facts and marks requirements automatically;
- lets the user answer only what remains unknown;
- supports Meets / Doesn’t meet / Unknown for every requirement;
- saves each answer immediately and lets the user finish later;
- shows the match score and evaluation coverage updating live;
- flags manual answers that disagree with stored property facts, with a link
  to correct the property data.

Precedence is explicit: property facts are never changed by an evaluation.
A manual observation is used for scoring when present, and a visible conflict
warning explains the difference. Selecting the automatic value again clears
the manual override.

## More reliable budgets (V2.1)

Budget plans now carry an explicit reliability state:

- **Complete estimate** — assumptions were accepted or supplied.
- **Estimate using assumptions** — taxes, insurance and maintenance use
  labelled defaults.
- **Partial estimate** — price or HOA is missing.

Comparison tables hide a monthly cost when the plan is partial, show when
assumptions were used, and link to the underlying plan. A property price below
`NEXT_PUBLIC_PRICE_WARNING_THRESHOLD` (default **$25,000**) requires explicit
confirmation but is never silently replaced.

## Data storage and sync

| Data | Storage | Sync |
| --- | --- | --- |
| Users / profiles | `profiles` (shared owner for now) | Only when V2 tables exist |
| Wishlists | `wishlists` or `localStorage` | Supabase when `0002` is applied |
| Requirements | `wishlist_requirements` or `localStorage` | Supabase when `0002` is applied |
| Homes | `homes` | Shared Supabase dataset |
| Feature facts | `property_details.facts` or `localStorage` | Supabase when `0002` is applied |
| Photos | `property_details.photo` (compressed data URL) | Supabase when `0002` is applied |
| Budget plans | `budget_scenarios` or `localStorage` | Supabase when `0002` is applied |
| Evaluations | `property_evaluations` or `localStorage` | Supabase when `0003` is applied |
| Tour notes | `tour_notes` | Shared Supabase dataset |
| Comparison notes | `comparison_notes` | Shared Supabase dataset |

See [`docs/v2.1-persistence.md`](docs/v2.1-persistence.md) for the full
storage/sync report and safe migration sequence.

No Supabase Storage bucket and no service-role key are used in the browser.
Local data is never deleted by the app when migrations are applied. Back up
`localStorage` before applying `0002`/`0003` if the device already contains
V2/V2.1 data.

## Cloudflare deployment

The app is a standard Next.js App Router project and can be deployed to
Cloudflare Workers with the OpenNext adapter, or to Cloudflare Pages with a
Workers-backed Next runtime. Keep the Supabase URL and anon key as public
build/runtime variables; never expose a service-role key. The free Miami-Dade
and Photon lookups are server routes and need the Node/Workers runtime
available. Verify that the chosen adapter supports the App Router route
handlers before switching production traffic. Do not deploy until the
migrations and RLS strategy are approved.

## Tests

```bash
npm test        # 69 deterministic unit tests (Vitest)
npm run lint    # ESLint
npm run build   # production build
```

Coverage includes weighted scoring, guided evaluations, automatic evaluation
of known facts, manual overrides and conflicts, dealbreaker exclusions,
wishlist switching, mortgage math including zero interest, budget reliability,
price thresholds, comparison selection, property persistence and owner data
isolation.

## Scripts

```bash
npm run dev    # development server (LAN + PWA friendly)
npm run build  # production build
npm test       # unit tests
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
    app-data.tsx            shared state, legacy + V2 Supabase reads/writes
    homes.ts                Home type, formatting, demo homes
    defaults.ts             starter data
    types.ts                legacy persisted record types
    v2-types.ts             wishlists, requirements, facts, scenarios
    scoring.ts              deterministic weighted match engine
    finance.ts              amortization, ownership cost, upfront cash
    property-facts.ts       converts homes + details into scoring facts
    wishlists.ts            wishlist defaults, import, duplicate, progress
    ownership.ts            owner scoping and write guards
    validation.ts           numeric, URL and suspicious-price validation
    image.ts                client-side photo compression
    miami-dade-parcels.ts   Miami-Dade County parcel lookup (no key)
    stored-properties.ts    reads saved facts back from Supabase
  api/
    address-search/         Photon-backed address suggestions
    property-lookup/        free county public records + optional fallback
  components/
    dashboard.tsx
    screens/                all eight screens + Add Home
supabase/migrations/        SQL schema + policies
```


## V2 notes and limitations

- The current deployment intentionally remains a **shared private workspace**
  (no login), matching the original app. V2 records carry an `owner_id` and the
  migration includes auth-ready RLS policies, but the live project still uses
  the shared policies until Supabase Auth is enabled. Do not share the
  deployment publicly until then.
- If `0002_v2.sql` has not been run, wishlists, photos, personal notes and
  budget plans are stored only on the current device. The More screen shows
  whether V2 data is synced or device-only.
- Uploaded photos are compressed in the browser and stored as data URLs. This
  avoids Storage costs but is intended for a handful of shortlisted homes, not
  a large photo library.
- Scores are intentionally deterministic. No AI or third-party valuation is
  used.
