"use client";

import { useAppData } from "../../lib/app-data";
import { formatPrice, type Home } from "../../lib/homes";
import { HouseIllustration } from "../house-illustration";
import { BackButton } from "../back-button";
import {
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  HeartIcon,
  MapPinIcon,
  ShareIcon,
} from "../icons";

export function PropertyScreen({
  home,
  onBack,
  onOpenTour,
  onOpenNeighborhood,
}: {
  home: Home;
  onBack: () => void;
  onOpenTour: () => void;
  onOpenNeighborhood: () => void;
}) {
  const { toggleSaved, setTourRequested } = useAppData();
  const saved = home.saved;
  const scheduled = home.tourRequested;

  const specs = [
    { value: home.beds, label: "Beds" },
    { value: home.baths, label: "Baths" },
    { value: home.sqft.toLocaleString("en-US"), label: "Sq ft" },
    { value: home.lot, label: "Lot" },
  ];

  const details = [
    { label: "Property type", value: home.type },
    { label: "Year built", value: String(home.yearBuilt) },
    { label: "HOA", value: `$${home.hoa}/mo` },
    { label: "Days on market", value: `${home.daysOnMarket} days` },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-[298px] w-full shrink-0">
        <div
          className="absolute inset-0"
          style={{ filter: home.imageFilter }}
        >
          <HouseIllustration className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/25" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-7">
          <BackButton onClick={onBack} label="Go back" />

          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Share this home"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/40 bg-cream/90 text-olive backdrop-blur transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
            >
              <ShareIcon className="h-[17px] w-[17px]" />
            </button>
            <button
              type="button"
              onClick={() => toggleSaved(home.id)}
              aria-label={saved ? "Remove from saved homes" : "Save this home"}
              aria-pressed={saved}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/40 bg-cream/90 text-olive backdrop-blur transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
            >
              <HeartIcon
                className={[
                  "h-[17px] w-[17px]",
                  saved ? "fill-current" : "",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-7 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-cream/95 px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-olive backdrop-blur">
              {home.match}% Match
            </span>
            <span className="rounded-full border border-cream/40 bg-ink/25 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] text-cream backdrop-blur">
              For Sale
            </span>
            {home.gated && (
              <span className="rounded-full border border-cream/40 bg-ink/25 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] text-cream backdrop-blur">
                Gated
              </span>
            )}
          </div>
          <span className="shrink-0 rounded-full border border-cream/35 bg-ink/25 px-2.5 py-1.5 text-[9px] tracking-[0.08em] text-cream backdrop-blur">
            1 / 24
          </span>
        </div>
      </div>

      <div className="relative z-10 -mt-5 flex-1 rounded-t-[30px] bg-cream px-6 pb-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-[27px] leading-[1.05] tracking-[-0.02em] text-ink">
              {home.address}
            </h1>
            <p className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-muted">
              <MapPinIcon className="h-3.5 w-3.5 text-olive/70" />
              {home.city}
            </p>
          </div>
          <p className="shrink-0 pt-1 font-serif text-[22px] leading-tight text-ink">
            {formatPrice(home.price)}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-4 rounded-2xl border border-line bg-white/50 py-3">
          {specs.map((spec, index) => (
            <div
              key={spec.label}
              className={[
                "px-2 text-center",
                index > 0 ? "border-l border-line/70" : "",
              ].join(" ")}
            >
              <p className="font-serif text-[19px] leading-none text-ink">
                {spec.value}
              </p>
              <p className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-muted">
                {spec.label}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <h2 className="font-serif text-[19px] text-ink">About this home</h2>
          <p className="mt-2 text-[12px] leading-[1.7] text-muted">
            {home.description}
          </p>
        </section>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {home.features.map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-line bg-parchment/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-muted"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={onOpenTour}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/50 px-4 py-3.5 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-parchment text-olive">
              <CalendarIcon className="h-[17px] w-[17px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-ink">
                Tour Notes
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                Rating, notes, pros and cons
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted/70" />
          </button>

          <button
            type="button"
            onClick={onOpenNeighborhood}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/50 px-4 py-3.5 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-parchment text-olive">
              <MapPinIcon className="h-[17px] w-[17px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-ink">
                Neighborhood
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                Schools, commute times and flood zone
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted/70" />
          </button>
        </div>

        <section className="mt-6">
          <h2 className="font-serif text-[19px] text-ink">Home details</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white/50">
            {details.map((detail, index) => (
              <div
                key={detail.label}
                className={[
                  "flex items-center justify-between px-4 py-3 text-[11px]",
                  index > 0 ? "border-t border-line/70" : "",
                ].join(" ")}
              >
                <span className="text-muted">{detail.label}</span>
                <span className="text-ink/90">{detail.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-20 flex gap-2 border-t border-line bg-cream/95 px-5 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setTourRequested(home.id, true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-olive py-3.5 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          {scheduled ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Tour Requested
            </>
          ) : (
            <>
              <CalendarIcon className="h-4 w-4" />
              Schedule Tour
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => toggleSaved(home.id)}
          aria-pressed={saved}
          className={[
            "flex items-center justify-center gap-1.5 rounded-full border px-4 py-3.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40",
            saved
              ? "border-olive bg-olive/10 text-olive"
              : "border-line bg-transparent text-ink/80 hover:bg-parchment",
          ].join(" ")}
        >
          <HeartIcon
            className={["h-4 w-4", saved ? "fill-current" : ""].join(" ")}
          />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
