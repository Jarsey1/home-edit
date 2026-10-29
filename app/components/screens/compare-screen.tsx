"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useAppData } from "../../lib/app-data";
import {
  formatLotLabel,
  formatPriceOrPending,
  type Home,
} from "../../lib/homes";
import {
  translatePropertyType,
  useI18n,
  type TranslationKey,
} from "../../lib/i18n";
import type { Locale } from "../../lib/locale";
import { HouseIllustration } from "../house-illustration";
import { CheckIcon, PlusIcon, TrashIcon } from "../icons";

type Row = {
  label: string;
  values: (string | number | boolean)[];
};

function buildRows(
  homes: Home[],
  expanded: boolean,
  t: (key: TranslationKey) => string,
  locale: Locale,
): Row[] {
  const rows: Row[] = [
    {
      label: t("common.bedrooms"),
      values: homes.map((home) => (home.beds > 0 ? home.beds : "—")),
    },
    {
      label: t("common.bathrooms"),
      values: homes.map((home) => (home.baths > 0 ? home.baths : "—")),
    },
    {
      label: t("common.squareFeet"),
      values: homes.map((home) =>
        home.sqft > 0
          ? home.sqft.toLocaleString(locale === "es" ? "es-US" : "en-US")
          : "—",
      ),
    },
    {
      label: t("common.lotSize"),
      values: homes.map((home) => formatLotLabel(home.lot, locale) || "—"),
    },
    {
      label: t("common.garage"),
      values: homes.map((home) => home.garage || "—"),
    },
    { label: t("common.pool"), values: homes.map((home) => home.pool) },
    { label: t("common.gated"), values: homes.map((home) => home.gated) },
    {
      label: t("common.hoaFee"),
      values: homes.map((home) => (home.hoa > 0 ? `$${home.hoa}` : "—")),
    },
  ];

  if (expanded) {
    rows.push(
      {
        label: t("common.yearBuilt"),
        values: homes.map((home) => (home.yearBuilt > 0 ? home.yearBuilt : "—")),
      },
      {
        label: t("common.type"),
        values: homes.map(
          (home) =>
            translatePropertyType(home.type, locale) || "—",
        ),
      },
      {
        label: t("common.daysListed"),
        values: homes.map((home) =>
          home.daysOnMarket > 0 ? home.daysOnMarket : "—",
        ),
      },
    );
  }

  return rows;
}

export function CompareScreen({
  onOpenProperty,
  onAddHome,
}: {
  onOpenProperty: (homeId: string) => void;
  onAddHome: () => void;
}) {
  const { homes, comparisonNotes, addComparisonNote, removeHome } = useAppData();
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    address: string;
  } | null>(null);
  const rows = buildRows(homes, expanded, t, locale);
  const columns = Math.max(homes.length, 1);
  const scrolls = homes.length > 3;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `76px repeat(${columns}, minmax(0, 1fr))`,
    ...(scrolls ? { minWidth: 76 + columns * 96 } : {}),
  };

  function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!noteDraft.trim()) return;
    addComparisonNote(noteDraft);
    setNoteDraft("");
    setAddingNote(false);
  }

  function confirmRemove() {
    if (!pendingRemove) return;
    removeHome(pendingRemove.id);
    setPendingRemove(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between px-6 pt-8">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("compare.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            {t("compare.title")}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setAddingNote((value) => !value)}
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-olive px-3.5 py-2.5 text-[11px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {t("common.add")}
        </button>
      </header>

      {pendingRemove && (
        <div
          role="alertdialog"
          aria-label={t("common.removeAddress", {
            address: pendingRemove.address,
          })}
          className="mx-6 mt-4 rounded-2xl border border-line bg-parchment px-4 py-3.5"
        >
          <p className="text-[12px] font-medium leading-5 text-ink">
            {t("compare.removeConfirmTitle", {
              address: pendingRemove.address,
            })}
          </p>
          <p className="mt-1 text-[10.5px] leading-4 text-muted">
            {t("compare.removeConfirmBody")}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setPendingRemove(null)}
              className="flex-1 rounded-full border border-line bg-white/70 py-2.5 text-[11px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              {t("common.keepHome")}
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              className="flex-1 rounded-full bg-olive py-2.5 text-[11px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
            >
              {t("common.remove")}
            </button>
          </div>
        </div>
      )}

      {addingNote && (
        <form
          onSubmit={submitNote}
          className="mx-6 mt-4 flex items-center gap-2 rounded-2xl border border-line bg-white/60 p-2 pl-4"
        >
          <input
            autoFocus
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder={t("compare.notePlaceholder")}
            aria-label={t("compare.noteAria")}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/70"
          />
          <button
            type="submit"
            className="rounded-full bg-olive px-3 py-2 text-[10px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
          >
            {t("common.add")}
          </button>
        </form>
      )}

      {comparisonNotes.length > 0 && (
        <div className="mx-6 mt-4 rounded-2xl border border-line bg-parchment px-4 py-3.5">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
            {t("compare.notes")}
          </p>
          <ul className="mt-2 space-y-1.5">
            {comparisonNotes.map((note) => (
              <li
                key={note.id}
                className="text-[11px] leading-4 text-ink/85"
              >
                {note.body}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-6 pb-9 pt-5">
        {homes.length === 0 ? (
          <div className="rounded-[20px] border border-line bg-white/45 px-5 py-10 text-center">
            <p className="font-serif text-[19px] leading-tight text-ink">
              {t("compare.emptyTitle")}
            </p>
            <p className="mt-2 text-[11.5px] leading-5 text-muted">
              {t("compare.emptyBody")}
            </p>
            <button
              type="button"
              onClick={onAddHome}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-olive px-4 py-2.5 text-[11px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t("add.addHome")}
            </button>
          </div>
        ) : (
          <>
            <div
              className="-mx-6 overflow-x-auto px-6"
              role="region"
              aria-label={t("compare.regionAria")}
              tabIndex={0}
            >
              <div className="grid" style={gridStyle}>
                <div aria-hidden="true" />

                {homes.map((home) => (
                  <div key={home.id} className="relative min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenProperty(home.id)}
                      aria-label={t("common.view", { address: home.address })}
                      className="block w-full px-1 pb-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
                    >
                      <div className="relative h-[68px] w-full overflow-hidden rounded-xl border border-line/80">
                        <div
                          className="h-full w-full"
                          style={{ filter: home.imageFilter }}
                        >
                          <HouseIllustration className="h-full w-full" />
                        </div>
                        <span className="absolute right-1 top-1 rounded-full bg-cream/95 px-1.5 py-0.5 text-[8px] font-medium text-olive backdrop-blur">
                          {home.match > 0
                            ? t("compare.matchBadge", {
                                percent: home.match,
                              })
                            : t("common.new")}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-medium leading-[1.2] text-ink">
                        {home.address}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[9.5px] text-muted">
                        {formatPriceOrPending(home.price, locale)}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingRemove({
                          id: home.id,
                          address: home.address,
                        })
                      }
                      aria-label={t("common.removeAddressFromComparison", {
                        address: home.address,
                      })}
                      className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-cream/70 bg-cream/90 text-muted/80 shadow-sm backdrop-blur transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-[20px] border border-line bg-white/45">
                {rows.map((row, rowIndex) => (
                  <div
                    key={row.label}
                    className={[
                      "grid items-center",
                      rowIndex > 0 ? "border-t border-line/70" : "",
                    ].join(" ")}
                    style={gridStyle}
                  >
                    <div className="px-2.5 py-3 text-[10px] leading-[1.35] text-muted">
                      {row.label}
                    </div>
                    {row.values.map((value, index) => (
                      <div
                        key={`${row.label}-${homes[index]?.id ?? index}`}
                        className="border-l border-line/50 px-1 py-3 text-center text-[11px] tabular-nums text-ink/90"
                      >
                        {typeof value === "boolean" ? (
                          value ? (
                            <CheckIcon className="mx-auto h-4 w-4 text-olive" />
                          ) : (
                            <span className="text-muted/60">—</span>
                          )
                        ) : (
                          value
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-3 text-center text-[10px] text-muted">
              {scrolls ? t("compare.swipeHint") : t("compare.tapHint")}
            </p>

            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-5 w-full rounded-full bg-olive py-3.5 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {expanded ? t("compare.showLess") : t("compare.viewFull")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
