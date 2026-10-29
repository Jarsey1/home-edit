"use client";

import type { ComponentType, SVGProps } from "react";
import { useAppData } from "../../lib/app-data";
import {
  BudgetIcon,
  CalendarIcon,
  ChevronRightIcon,
  DocumentIcon,
  HeartIcon,
  HomesIcon,
  MapPinIcon,
  SettingsIcon,
  SparkleIcon,
} from "../icons";

type Row = {
  label: string;
  detail: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  badge?: string;
};

export function MoreScreen({
  onOpenHomes,
  onOpenWishlist,
  onOpenBudget,
  onOpenTour,
  onOpenNeighborhood,
}: {
  onOpenHomes: () => void;
  onOpenWishlist: () => void;
  onOpenBudget: () => void;
  onOpenTour: () => void;
  onOpenNeighborhood: () => void;
}) {
  const { savedCount, upcomingTours, topMatch, status } = useAppData();

  const searchRows: Row[] = [
    {
      label: "Compare Homes",
      detail: `${savedCount} saved ${savedCount === 1 ? "home" : "homes"}, side by side`,
      Icon: HomesIcon,
      onClick: onOpenHomes,
    },
    {
      label: "Wishlist",
      detail: "Must-haves, nice-to-haves and progress",
      Icon: HeartIcon,
      onClick: onOpenWishlist,
    },
    {
      label: "Tour Notes",
      detail: "Ratings, impressions, pros and cons",
      Icon: CalendarIcon,
      onClick: onOpenTour,
    },
    {
      label: "Neighborhood",
      detail: "Schools, errands, flood and evacuation",
      Icon: MapPinIcon,
      onClick: onOpenNeighborhood,
    },
    {
      label: "Budget Planner",
      detail: "The real monthly number",
      Icon: BudgetIcon,
      onClick: onOpenBudget,
    },
  ];

  const soonRows: Row[] = [
    {
      label: "Documents",
      detail: "Disclosures, inspections and offers",
      Icon: DocumentIcon,
      badge: "Soon",
    },
    {
      label: "Cities to Avoid",
      detail: "Keep your dealbreakers close",
      Icon: SparkleIcon,
      badge: "Soon",
    },
    {
      label: "Settings",
      detail: "Notifications, account and appearance",
      Icon: SettingsIcon,
      badge: "Soon",
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-9">
        <div className="flex items-center justify-between">
          <p className="font-serif text-[19px] tracking-[-0.01em] text-ink">
            The Next Home Edit
          </p>
          <span className="h-2 w-2 rounded-full bg-olive" aria-hidden="true" />
        </div>

        <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          Everything else
        </p>
        <h1 className="mt-1 font-serif text-[36px] leading-none tracking-[-0.02em] text-ink">
          More
        </h1>
      </header>

      <div className="px-6 pb-9">
        <div className="mt-6 rounded-[24px] bg-olive p-5 text-cream">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-cream/55">
              Your search so far
            </p>
            <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-cream/70">
              Active
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: String(savedCount), label: "Saved homes" },
              { value: String(upcomingTours), label: "Tours" },
              {
                value: topMatch.match > 0 ? `${topMatch.match}%` : "New",
                label: "Top match",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-[24px] leading-none">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-[9px] uppercase tracking-[0.08em] text-cream/55">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-1.5 border-t border-cream/10 pt-3 text-[9px] uppercase tracking-[0.12em] text-cream/45">
            <span
              aria-hidden="true"
              className={[
                "h-1.5 w-1.5 rounded-full",
                status === "synced"
                  ? "bg-cream/80"
                  : status === "local"
                    ? "bg-gold"
                    : "bg-cream/30",
              ].join(" ")}
            />
            {status === "synced"
              ? "Synced across your devices"
              : status === "local"
                ? "Saved on this device only"
                : "Connecting…"}
          </p>
        </div>

        <RowGroup title="Your search" rows={searchRows} />
        <RowGroup title="Coming soon" rows={soonRows} />

        <p className="mt-7 text-center text-[10px] leading-5 text-muted">
          The Next Home Edit
          <br />
          Version 1.0 · Made for your search
        </p>
      </div>
    </div>
  );
}

function RowGroup({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="mt-7">
      <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>

      <div className="mt-3 overflow-hidden rounded-[22px] border border-line bg-white/50">
        {rows.map(({ label, detail, Icon, onClick, badge }, index) => {
          const content = (
            <>
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  onClick ? "bg-parchment text-olive" : "bg-sand/60 text-muted/70",
                ].join(" ")}
              >
                <Icon className="h-[17px] w-[17px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-ink">
                  {label}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-muted">
                  {detail}
                </span>
              </span>

              {badge ? (
                <span className="shrink-0 rounded-full bg-parchment px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-muted">
                  {badge}
                </span>
              ) : (
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted/60" />
              )}
            </>
          );

          const classes = [
            "flex w-full items-center gap-3 px-4 py-3.5 text-left",
            index > 0 ? "border-t border-line/70" : "",
          ].join(" ");

          return onClick ? (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className={[
                classes,
                "transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30",
              ].join(" ")}
            >
              {content}
            </button>
          ) : (
            <div key={label} className={classes} aria-disabled="true">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
