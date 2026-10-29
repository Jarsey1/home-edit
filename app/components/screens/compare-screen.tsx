"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAppData } from "../../lib/app-data";
import {
  formatGarageLabel,
  formatLotLabel,
  formatPrice,
  formatPriceOrPending,
} from "../../lib/homes";
import {
  translatePropertyType,
  translateWishlistName,
  useI18n,
} from "../../lib/i18n";
import { buildComparisonSummary, type ScoreResult } from "../../lib/scoring";
import { PropertyPhoto } from "../property-photo";
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  QuestionIcon,
  TrashIcon,
  XIcon,
} from "../icons";

type Row = {
  label: string;
  values: Array<string | number | boolean | null>;
  emphasis?: boolean;
};

function statusText(
  score: ScoreResult,
  t: ReturnType<typeof useI18n>["t"],
): string {
  switch (score.status) {
    case "disqualified":
      return t("compare.statusDisqualified");
    case "missing-must":
      return t("compare.statusMissing", { count: score.mustMissing.length });
    case "awaiting-verification":
      return t("compare.statusUnverified", {
        count: score.mustUnknown.length,
      });
    case "meets-all-must":
      return t("compare.statusMeetsAll");
    case "no-must-haves":
      return t("compare.statusNoMust");
    default:
      return t("compare.statusInsufficient");
  }
}

function statusTone(score: ScoreResult) {
  if (score.disqualified) return "text-clay";
  if (score.status === "missing-must") return "text-clay/90";
  if (score.status === "awaiting-verification" || score.status === "insufficient")
    return "text-muted";
  return "text-olive";
}

function PersonalCell({
  score,
  kind,
}: {
  score: ScoreResult;
  kind: "match" | "coverage" | "must";
}) {
  if (kind === "match") {
    if (score.score === null) {
      return <span className="text-[10px] text-muted">—</span>;
    }
    if (score.disqualified) {
      return <span className="text-[10px] text-clay">—</span>;
    }
    return (
      <span className="font-serif text-[16px] leading-none text-ink">
        {score.scoreRounded}%
      </span>
    );
  }
  if (kind === "coverage") {
    return (
      <span className="text-[10px] tabular-nums text-muted">
        {Math.round(score.coverage)}%
      </span>
    );
  }
  return null;
}

export function CompareScreen({
  onOpenProperty,
  onAddHome,
}: {
  onOpenProperty: (homeId: string) => void;
  onAddHome: () => void;
}) {
  const {
    homes,
    activeWishlist,
    comparisonNotes,
    addComparisonNote,
    removeHome,
    getMonthlyCostForHome,
    scoredHomes,
  } = useAppData();
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    address: string;
  } | null>(null);

  const entries = useMemo(
    () =>
      homes.map((home) => {
        const scored = scoredHomes.find((entry) => entry.home.id === home.id);
        return {
          home,
          score: scored?.score ?? null,
          monthlyCost: getMonthlyCostForHome(home.id),
        };
      }),
    [homes, scoredHomes, getMonthlyCostForHome],
  );

  const scoredEntries = entries.filter(
    (entry): entry is { home: (typeof homes)[number]; score: ScoreResult; monthlyCost: number | null } =>
      Boolean(entry.score),
  );

  const summary = useMemo(
    () =>
      buildComparisonSummary(
        scoredEntries.map((entry) => ({
          id: entry.home.id,
          address: entry.home.address,
          city: entry.home.city,
          score: entry.score,
          monthlyCost: entry.monthlyCost,
        })),
      ),
    [scoredEntries],
  );

  const columns = Math.max(homes.length, 1);
  const scrolls = homes.length > 2;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `88px repeat(${columns}, minmax(112px, 1fr))`,
    ...(scrolls ? { minWidth: 88 + columns * 118 } : {}),
  };

  const activeName = activeWishlist
    ? translateWishlistName(activeWishlist.name, locale)
    : "";

  const overviewRows: Row[] = [
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
      values: homes.map((home) => formatGarageLabel(home.garage, locale) || "—"),
    },
    {
      label: t("common.hoaFee"),
      values: homes.map((home) =>
        home.hoa > 0 ? formatPrice(home.hoa, locale) : "—",
      ),
    },
    { label: t("common.pool"), values: homes.map((home) => home.pool) },
    { label: t("common.gated"), values: homes.map((home) => home.gated) },
  ];

  const extraRows: Row[] = [
    {
      label: t("common.yearBuilt"),
      values: homes.map((home) => (home.yearBuilt > 0 ? home.yearBuilt : "—")),
    },
    {
      label: t("common.type"),
      values: homes.map(
        (home) => translatePropertyType(home.type, locale) || "—",
      ),
    },
    {
      label: t("common.daysListed"),
      values: homes.map((home) =>
        home.daysOnMarket > 0 ? home.daysOnMarket : "—",
      ),
    },
  ];

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

  function renderOverviewRows(rows: Row[]) {
    return rows.map((row, rowIndex) => (
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
                <XIcon className="mx-auto h-3.5 w-3.5 text-muted/45" />
              )
            ) : (
              value
            )}
          </div>
        ))}
      </div>
    ));
  }

  function renderPersonalRows() {
    const rows = [
      {
        label: t("compare.match"),
        render: (entry: (typeof scoredEntries)[number]) =>
          <PersonalCell score={entry.score} kind="match" />,
      },
      {
        label: t("compare.coverage"),
        render: (entry: (typeof scoredEntries)[number]) =>
          <PersonalCell score={entry.score} kind="coverage" />,
      },
      {
        label: t("compare.mustMet"),
        render: (entry: (typeof scoredEntries)[number]) => (
          <span className="inline-flex items-center gap-1 text-[10.5px] tabular-nums text-ink/85">
            <CheckIcon className="h-3.5 w-3.5 text-olive" />
            {entry.score.mustMet.length}/{entry.score.mustTotal}
          </span>
        ),
      },
      {
        label: t("compare.mustMissing"),
        render: (entry: (typeof scoredEntries)[number]) =>
          entry.score.mustMissing.length === 0 ? (
            <CheckIcon className="mx-auto h-4 w-4 text-olive" />
          ) : (
            <span className="inline-flex items-center gap-1 text-[10.5px] tabular-nums text-clay">
              <XIcon className="h-3.5 w-3.5" />
              {entry.score.mustMissing.length}
            </span>
          ),
      },
      {
        label: t("compare.mustUnknown"),
        render: (entry: (typeof scoredEntries)[number]) =>
          entry.score.mustUnknown.length === 0 ? (
            <CheckIcon className="mx-auto h-4 w-4 text-olive" />
          ) : (
            <span className="inline-flex items-center gap-1 text-[10.5px] tabular-nums text-muted">
              <QuestionIcon className="h-3.5 w-3.5" />
              {entry.score.mustUnknown.length}
            </span>
          ),
      },
      {
        label: t("compare.dealbreakers"),
        render: (entry: (typeof scoredEntries)[number]) =>
          entry.score.disqualified ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-clay">
              <XIcon className="h-3.5 w-3.5" />
            </span>
          ) : entry.score.dealbreakersUnknown.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted">
              <QuestionIcon className="h-3.5 w-3.5" />
              {entry.score.dealbreakersUnknown.length}
            </span>
          ) : (
            <CheckIcon className="mx-auto h-4 w-4 text-olive" />
          ),
      },
      {
        label: t("compare.monthlyCost"),
        render: (entry: (typeof scoredEntries)[number]) =>
          entry.monthlyCost === null ? (
            <span className="text-[10px] text-muted">—</span>
          ) : (
            <span className="text-[11px] tabular-nums text-ink/90">
              {formatPrice(Math.round(entry.monthlyCost), locale)}
            </span>
          ),
      },
      {
        label: t("compare.estimated"),
        render: (entry: (typeof scoredEntries)[number]) => (
          <span className={`text-[9.5px] leading-4 ${statusTone(entry.score)}`}>
            {statusText(entry.score, t)}
          </span>
        ),
      },
    ];

    return rows.map((row, rowIndex) => (
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
        {homes.map((home) => {
          const entry = scoredEntries.find(
            (candidate) => candidate.home.id === home.id,
          );
          return (
            <div
              key={`${row.label}-${home.id}`}
              className="border-l border-line/50 px-1 py-3 text-center"
            >
              {entry ? (
                row.render(entry)
              ) : (
                <span className="text-[10px] text-muted">—</span>
              )}
            </div>
          );
        })}
      </div>
    ));
  }

  const disqualifiedCount = summary.disqualified.length;

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
          {activeWishlist && (
            <p className="mt-2 text-[10px] text-muted">
              {t("compare.currentWishlist", { name: activeName })}
            </p>
          )}
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
              className="min-h-10 flex-1 rounded-full border border-line bg-white/70 text-[11px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              {t("common.keepHome")}
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              className="min-h-10 flex-1 rounded-full bg-clay text-[11px] font-medium text-cream transition-colors hover:bg-clay/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
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
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="min-h-9 rounded-full bg-olive px-3 text-[10px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
          >
            {t("common.add")}
          </button>
        </form>
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
            <section className="rounded-[24px] bg-olive p-5 text-cream">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-cream/75">
                  {t("compare.summary")}
                </p>
                <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-cream/80">
                  {activeName}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-cream/80">
                {t("compare.summaryHint")}
              </p>

              <ul className="mt-4 space-y-2.5">
                {summary.highestScore?.score.score !== null &&
                  summary.highestScore?.score.score !== undefined && (
                  <SummaryLine tone="cream">
                    {t("compare.highestScore", {
                      wishlist: activeName,
                      address: summary.highestScore.address,
                      percent: summary.highestScore.score.scoreRounded ?? 0,
                      coverage: Math.round(summary.highestScore.score.coverage),
                    })}
                  </SummaryLine>
                )}

                {summary.lowestCost?.monthlyCost !== undefined &&
                  summary.lowestCost?.monthlyCost !== null && (
                  <SummaryLine tone="cream">
                    {t("compare.lowestCost", {
                      address: summary.lowestCost.address,
                      amount: formatPrice(
                        Math.round(summary.lowestCost.monthlyCost),
                        locale,
                      ),
                    })}
                  </SummaryLine>
                )}

                {summary.mostMustHaves && summary.mostMustHaves.score.mustMet.length > 0 && (
                  <SummaryLine tone="cream">
                    {t("compare.mostMust", {
                      address: summary.mostMustHaves.address,
                      count: summary.mostMustHaves.score.mustMet.length,
                    })}
                  </SummaryLine>
                )}

                {disqualifiedCount === 0 && (
                  <SummaryLine tone="cream">
                    {t("compare.noDealbreakers")}
                  </SummaryLine>
                )}
                {summary.disqualified.map((candidate) => (
                  <SummaryLine key={`bad-${candidate.id}`} tone="clay">
                    {t("compare.disqualified", { address: candidate.address })}
                  </SummaryLine>
                ))}
                {summary.missingInformation.slice(0, 2).map((candidate) => (
                  <SummaryLine key={`info-${candidate.id}`} tone="muted">
                    {t("compare.missingInfo", {
                      address: candidate.address,
                      percent: Math.round(candidate.score.coverage),
                    })}
                  </SummaryLine>
                ))}
                {summary.highestScore === null &&
                  disqualifiedCount === 0 &&
                  summary.missingInformation.length === 0 && (
                    <SummaryLine tone="muted">
                      {t("compare.noEligible")}
                    </SummaryLine>
                  )}
              </ul>
            </section>

            {comparisonNotes.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white/45">
                <button
                  type="button"
                  onClick={() => setNotesOpen((value) => !value)}
                  aria-expanded={notesOpen}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30"
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                    {notesOpen
                      ? t("compare.notesHide")
                      : t("compare.notesShow", {
                          count: comparisonNotes.length,
                        })}
                  </span>
                  <ChevronDownIcon
                    className={[
                      "h-4 w-4 text-muted transition-transform",
                      notesOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>
                {notesOpen && (
                  <ul className="space-y-1.5 border-t border-line/70 px-4 py-3">
                    {comparisonNotes.map((note) => (
                      <li key={note.id} className="text-[11px] leading-4 text-ink/85">
                        {note.body}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div
              className="-mx-6 mt-4 overflow-x-auto px-6"
              role="region"
              aria-label={t("compare.regionAria")}
              tabIndex={0}
            >
              <div className="grid" style={gridStyle}>
                <div aria-hidden="true" />

                {homes.map((home) => {
                  const entry = scoredEntries.find(
                    (candidate) => candidate.home.id === home.id,
                  );
                  return (
                    <div key={home.id} className="relative min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenProperty(home.id)}
                        className="block w-full px-1 pb-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
                      >
                        <div className="relative h-[76px] w-full overflow-hidden rounded-xl border border-line/80">
                          <PropertyPhoto home={home} className="h-full w-full" />
                          <span
                            className={[
                              "absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium backdrop-blur",
                              entry?.score.disqualified
                                ? "bg-clay/95 text-cream"
                                : "bg-cream/95 text-olive",
                            ].join(" ")}
                          >
                            {entry?.score.score !== null &&
                            entry?.score.score !== undefined &&
                            !entry.score.disqualified
                              ? t("compare.matchBadge", {
                                  percent: entry.score.scoreRounded ?? 0,
                                })
                              : entry?.score.disqualified
                                ? t("property.dealbreaker")
                                : t("compare.notEnough")}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] font-medium leading-[1.2] text-ink">
                          {home.address}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] text-muted">
                          {home.city || "—"}
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
                        className="absolute left-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-cream/70 bg-cream/90 text-muted shadow-sm backdrop-blur transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                  {t("compare.personalized")}
                </p>
                <span className="h-px flex-1 bg-line" />
              </div>

              <div className="mt-2 overflow-hidden rounded-[20px] border border-line bg-white/45">
                {renderPersonalRows()}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                  {t("compare.overview")}
                </p>
                <span className="h-px flex-1 bg-line" />
              </div>

              <div className="mt-2 overflow-hidden rounded-[20px] border border-line bg-white/45">
                {renderOverviewRows(overviewRows)}
                {expanded && renderOverviewRows(extraRows)}
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

function SummaryLine({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "cream" | "clay" | "muted";
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={[
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "clay"
            ? "bg-[#e0a294]"
            : tone === "muted"
              ? "bg-cream/35"
              : "bg-cream/70",
        ].join(" ")}
      />
      <span
        className={[
          "text-[11px] leading-[1.55]",
          tone === "clay" ? "text-[#f0c9c0]" : tone === "muted" ? "text-cream/75" : "text-cream/85",
        ].join(" ")}
      >
        {children}
      </span>
    </li>
  );
}
