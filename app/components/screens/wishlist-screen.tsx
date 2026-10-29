"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAppData } from "../../lib/app-data";
import { translateWishlistText, useI18n } from "../../lib/i18n";
import type { WishlistItem } from "../../lib/types";
import { BackButton } from "../back-button";
import { HouseIllustration } from "../house-illustration";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  PlusIcon,
} from "../icons";

type Filter = "all" | "must" | "nice";

type Category = {
  name: string;
  done: number;
  total: number;
  items: WishlistItem[];
};

function groupCategories(items: WishlistItem[]): Category[] {
  const groups = new Map<string, WishlistItem[]>();

  for (const item of items) {
    if (item.kind !== "category") continue;
    const name = item.category ?? "Other";
    const group = groups.get(name) ?? [];
    group.push(item);
    groups.set(name, group);
  }

  return [...groups.entries()].map(([name, categoryItems]) => ({
    name,
    done: categoryItems.filter((item) => item.done).length,
    total: categoryItems.length,
    items: categoryItems,
  }));
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
      <div
        className="h-full rounded-full bg-olive transition-[width] duration-300"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function WishlistScreen({
  onBack,
  onBrowseHomes,
}: {
  onBack: () => void;
  onBrowseHomes: () => void;
}) {
  const { wishlist, toggleWishlistItem, addWishlistItem } = useAppData();
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const must = useMemo(
    () => wishlist.filter((item) => item.kind === "must"),
    [wishlist],
  );
  const nice = useMemo(
    () => wishlist.filter((item) => item.kind === "nice"),
    [wishlist],
  );
  const categories = useMemo(() => groupCategories(wishlist), [wishlist]);

  const mustDone = must.filter((item) => item.done).length;
  const niceDone = nice.filter((item) => item.done).length;

  const filterTabs = [
    { id: "all" as const, label: t("wishlist.all") },
    { id: "must" as const, label: t("wishlist.must", { count: must.length }) },
    { id: "nice" as const, label: t("wishlist.nice", { count: nice.length }) },
  ];

  function startAdding() {
    if (filter === "all") setFilter("must");
    setAdding(true);
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    const label = draft.trim();
    if (!label) return;
    addWishlistItem(filter === "nice" ? "nice" : "must", label);
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between px-6 pt-8">
        <div className="flex items-start gap-3">
          <BackButton onClick={onBack} label={t("common.backToDashboard")} />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              {t("wishlist.eyebrow")}
            </p>
            <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
              {t("wishlist.title")}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={startAdding}
          aria-label={t("wishlist.addAria")}
          className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-olive text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="px-6 pb-9">
        <div className="mt-5 flex rounded-full border border-line bg-parchment p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={[
                "flex-1 rounded-full px-2 py-2 text-[11px] transition-colors",
                filter === tab.id
                  ? "bg-olive font-medium text-cream shadow-sm"
                  : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {adding && (
          <form
            onSubmit={addItem}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-white/60 p-2 pl-4"
          >
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                filter === "nice"
                  ? t("wishlist.addNice")
                  : t("wishlist.addMust")
              }
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted/70 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-olive px-3.5 py-2 text-[11px] font-medium text-cream"
            >
              {t("common.add")}
            </button>
          </form>
        )}

        {filter === "all" && (
          <div className="mt-5 space-y-2.5">
            {categories.map((category) => {
              const isOpen = openCategory === category.name;
              const percent = (category.done / Math.max(1, category.total)) * 100;
              return (
                <div
                  key={category.name}
                  className="overflow-hidden rounded-[20px] border border-line bg-white/50"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCategory(isOpen ? null : category.name)
                    }
                    aria-expanded={isOpen}
                    className="w-full px-4 pb-3.5 pt-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-ink">
                        {translateWishlistText(category.name, locale)}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted">
                        {category.done}/{category.total}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2.5">
                      <ProgressBar value={percent} />
                      <ChevronRightIcon
                        className={[
                          "h-3.5 w-3.5 shrink-0 text-muted/70 transition-transform",
                          isOpen ? "rotate-90" : "",
                        ].join(" ")}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <ul className="border-t border-line/80 px-4 py-3">
                      {category.items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={item.done}
                            onClick={() => toggleWishlistItem(item.id)}
                            className="flex w-full items-center gap-2.5 py-1.5 text-left text-[12px] text-ink/85 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
                          >
                            <span
                              className={[
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                item.done
                                  ? "border-olive bg-olive text-cream"
                                  : "border-line bg-cream",
                              ].join(" ")}
                            >
                              {item.done && (
                                <CheckIcon className="h-2.5 w-2.5" />
                              )}
                            </span>
                            <span
                              className={
                                item.done
                                  ? "text-muted line-through decoration-muted/40"
                                  : ""
                              }
                            >
                              {translateWishlistText(item.label, locale)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filter === "must" && (
          <Checklist
            items={must}
            onToggle={toggleWishlistItem}
            title={t("wishlist.mustComplete", {
              done: mustDone,
              total: must.length,
            })}
            percent={(mustDone / Math.max(1, must.length)) * 100}
          />
        )}

        {filter === "nice" && (
          <Checklist
            items={nice}
            onToggle={toggleWishlistItem}
            title={t("wishlist.niceComplete", {
              done: niceDone,
              total: nice.length,
            })}
            percent={(niceDone / Math.max(1, nice.length)) * 100}
          />
        )}

        <button
          type="button"
          onClick={onBrowseHomes}
          className="relative mt-5 block h-32 w-full overflow-hidden rounded-[24px] border border-line text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
        >
          <HouseIllustration className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-olive-deep/90 via-olive-deep/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div>
              <p className="font-serif text-[19px] leading-tight text-cream">
                {t("wishlist.inspiration")}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-cream/75">
                {t("wishlist.inspirationBody")}
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/95 text-olive">
              <ArrowRightIcon className="h-4 w-4" />
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

function Checklist({
  items,
  onToggle,
  title,
  percent,
}: {
  items: WishlistItem[];
  onToggle: (itemId: string) => void;
  title: string;
  percent: number;
}) {
  const { locale } = useI18n();

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <ProgressBar value={percent} />
        <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
          {Math.round(percent)}%
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted">{title}</p>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-white/50">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="checkbox"
            aria-checked={item.done}
            onClick={() => onToggle(item.id)}
            className={[
              "flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30",
              index > 0 ? "border-t border-line/70" : "",
              item.done ? "text-muted line-through decoration-muted/40" : "text-ink",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                item.done
                  ? "border-olive bg-olive text-cream"
                  : "border-line bg-cream text-transparent",
              ].join(" ")}
            >
              <CheckIcon className="h-3 w-3" />
            </span>
            {translateWishlistText(item.label, locale)}
          </button>
        ))}
      </div>
    </div>
  );
}
