"use client";

import type { ComponentType, SVGProps } from "react";
import {
  BudgetIcon,
  HeartIcon,
  HomeIcon,
  HomesIcon,
  MoreIcon,
} from "./icons";

export type TabId = "home" | "homes" | "wishlist" | "budget" | "more";

type Tab = {
  id: TabId;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const TABS: Tab[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "homes", label: "Homes", Icon: HomesIcon },
  { id: "wishlist", label: "Wishlist", Icon: HeartIcon },
  { id: "budget", label: "Budget", Icon: BudgetIcon },
  { id: "more", label: "More", Icon: MoreIcon },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-30 mt-auto border-t border-line/90 bg-cream/85 backdrop-blur-xl sm:rounded-b-[40px]"
    >
      <div className="flex items-stretch justify-between gap-1 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className="group flex flex-1 flex-col items-center gap-1 rounded-2xl pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <span
                className={[
                  "flex h-9 w-12 items-center justify-center rounded-full transition-colors duration-200",
                  isActive
                    ? "bg-olive text-cream"
                    : "text-muted group-hover:bg-parchment group-hover:text-olive",
                ].join(" ")}
              >
                <Icon className="h-[21px] w-[21px]" />
              </span>
              <span
                className={[
                  "text-[10px] leading-none tracking-[0.02em] transition-colors",
                  isActive
                    ? "font-medium text-olive"
                    : "text-muted group-hover:text-ink",
                ].join(" ")}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
