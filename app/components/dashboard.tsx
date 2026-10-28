"use client";

import { useAppData } from "../lib/app-data";
import { formatPrice } from "../lib/homes";
import { HouseIllustration } from "./house-illustration";
import { ArrowUpRightIcon, HeartIcon, SearchIcon } from "./icons";

export function Dashboard({
  onOpenProperty,
  onBrowseHomes,
}: {
  onOpenProperty: (homeId: string) => void;
  onBrowseHomes: () => void;
}) {
  const {
    topMatch: home,
    savedCount,
    upcomingTours,
    wishlistTotal,
    strongMatches,
    mustDone,
    mustTotal,
    toggleSaved,
  } = useAppData();

  const stats = [
    { value: String(savedCount), label: "Saved Homes" },
    { value: String(upcomingTours), label: "Upcoming Tours" },
    { value: String(wishlistTotal), label: "Wishlist Items" },
    { value: String(strongMatches), label: "Top Matches" },
  ];
  const progress = mustTotal > 0 ? (mustDone / mustTotal) * 100 : 0;
  const saved = home.saved;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between px-6 pt-9">
        <div>
          <h1 className="font-serif text-[36px] leading-[1.02] tracking-[-0.02em] text-ink">
            The Next
            <br />
            Home Edit
          </h1>
          <p className="mt-3 text-[13px] tracking-[0.01em] text-muted">
            Your home search, organized.
          </p>
        </div>

        <button
          type="button"
          onClick={onBrowseHomes}
          aria-label="Browse homes"
          className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-parchment/70 text-olive transition-colors hover:border-olive/30 hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
        >
          <SearchIcon className="h-[19px] w-[19px]" />
        </button>
      </header>

      <section className="mt-7 px-6">
        <div className="rounded-[26px] border border-line bg-parchment px-5 pb-5 pt-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              Your Progress
            </p>
            <p className="text-[13px] font-medium tracking-[0.03em] text-olive">
              {mustDone}
              <span className="text-muted/70">/{mustTotal}</span>
            </p>
          </div>

          <div
            role="progressbar"
            aria-label="Home search progress"
            aria-valuemin={0}
            aria-valuemax={mustTotal}
            aria-valuenow={mustDone}
            className="mt-3 h-1 w-full overflow-hidden rounded-full bg-sand"
          >
            <div
              className="h-full rounded-full bg-olive transition-[width] duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="font-serif text-[26px] leading-none text-ink">
                  {stat.value}
                </dd>
                <dt className="mt-1.5 text-[11px] tracking-[0.02em] text-muted">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-8 px-6 pb-9">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[23px] tracking-[-0.01em] text-ink">
            Your Top Match
          </h2>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
            {strongMatches} {strongMatches === 1 ? "match" : "matches"}
          </span>
        </div>

        <article className="mt-4 overflow-hidden rounded-[28px] border border-line bg-white/55">
          <div className="relative h-44">
            <button
              type="button"
              onClick={() => onOpenProperty(home.id)}
              aria-label={`View ${home.address}`}
              className="absolute inset-0 block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/40"
            >
              <span
                className="block h-full w-full"
                style={{ filter: home.imageFilter }}
              >
                <HouseIllustration className="h-full w-full" />
              </span>
            </button>

            <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-cream/95 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-olive shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-olive" />
              {home.match}% Match
            </span>

            <button
              type="button"
              onClick={() => toggleSaved(home.id)}
              aria-label={
                saved
                  ? `Remove ${home.address} from saved homes`
                  : `Save ${home.address}`
              }
              aria-pressed={saved}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-olive shadow-sm backdrop-blur transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/80"
            >
              <HeartIcon
                className={["h-[18px] w-[18px]", saved ? "fill-current" : ""].join(
                  " ",
                )}
              />
            </button>
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-[22px] leading-tight tracking-[-0.01em] text-ink">
                  {home.address}
                </h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                  {home.city}
                </p>
              </div>
              <p className="shrink-0 font-serif text-[21px] leading-tight text-ink">
                {formatPrice(home.price)}
              </p>
            </div>

            <p className="mt-4 text-[13px] text-muted">
              {home.beds} beds <span className="px-1 text-muted/50">·</span>{" "}
              {home.baths} baths <span className="px-1 text-muted/50">·</span>{" "}
              {home.sqft.toLocaleString("en-US")} sq ft
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line bg-parchment/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                For Sale
              </span>
              {home.gated && (
                <span className="rounded-full border border-line bg-parchment/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                  Gated Community
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-line/80 pt-4">
              <span className="text-[11px] tracking-[0.02em] text-muted">
                Updated today
              </span>
              <button
                type="button"
                onClick={() => onOpenProperty(home.id)}
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                View Details
                <ArrowUpRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
