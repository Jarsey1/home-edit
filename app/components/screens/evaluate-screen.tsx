"use client";

import { useMemo, useState } from "react";
import { useAppData } from "../../lib/app-data";
import { evaluationProgress, type EvaluationRow } from "../../lib/evaluations";
import { formatPrice, formatPriceOrPending, type Home } from "../../lib/homes";
import {
  categoryKey,
  importanceKey,
  translateRequirementName,
  translateWishlistName,
  useI18n,
  type TranslationKey,
} from "../../lib/i18n";
import type { Locale } from "../../lib/locale";
import type { EvaluationState } from "../../lib/scoring";
import {
  CATEGORY_ORDER,
  type WishlistCategory,
  type WishlistRequirement,
} from "../../lib/v2-types";
import { BackButton } from "../back-button";
import { PropertyPhoto } from "../property-photo";
import {
  CheckIcon,
  ChevronDownIcon,
  PencilIcon,
  QuestionIcon,
  XIcon,
} from "../icons";

function expectedLabel(
  requirement: WishlistRequirement,
  locale: Locale,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
) {
  const value = requirement.expectedValue;
  const currency =
    requirement.featureKey === "price" ||
    requirement.featureKey === "monthlyOwnershipCost" ||
    requirement.featureKey === "hoa";

  if (requirement.type === "yes") {
    return value === true ? t("common.yes") : t("common.no");
  }
  if (requirement.type === "range" && value && typeof value === "object") {
    const range = value as { min?: number; max?: number };
    return `${range.min ?? "?"} – ${range.max ?? "?"}`;
  }
  if (typeof value === "number") {
    const formatted = currency ? formatPrice(value, locale) : String(value);
    if (requirement.type === "min") return `≥ ${formatted}`;
    if (requirement.type === "max") return `≤ ${formatted}`;
    return formatted;
  }
  if (value && typeof value === "object" && "values" in value) {
    return (value as { values: string[] }).values.join(", ");
  }
  return value === null || value === "" ? "—" : String(value);
}

function StatusBadge({
  state,
  source,
  conflict,
}: {
  state: EvaluationState;
  source: EvaluationRow["source"];
  conflict: boolean;
}) {
  const { t } = useI18n();
  if (conflict) {
    return (
      <span className="rounded-full border border-clay/30 bg-clay/[0.08] px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em] text-clay">
        {t("evaluate.conflictBadge")}
      </span>
    );
  }
  if (source === "manual") {
    return (
      <span className="rounded-full border border-olive/25 bg-olive/[0.08] px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em] text-olive">
        {t("evaluate.manualBadge")}
      </span>
    );
  }
  if (source === "property") {
    return (
      <span className="rounded-full border border-line bg-parchment px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em] text-muted">
        {t("evaluate.autoBadge")}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-line bg-parchment px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em] text-muted">
      {state === "unknown" ? t("evaluate.unknown") : ""}
    </span>
  );
}

export function EvaluateScreen({
  home,
  onBack,
  onOpenWishlist,
  onOpenEdit,
}: {
  home: Home;
  onBack: () => void;
  onOpenWishlist: () => void;
  onOpenEdit: () => void;
}) {
  const {
    wishlists,
    activeWishlist,
    setActiveWishlist,
    activeRequirements,
    evaluations,
    setEvaluation,
    getEvaluationRows,
    getScoreForHome,
    saving,
  } = useAppData();
  const { t, locale } = useI18n();
  const [savedMessage, setSavedMessage] = useState("");
  const [openCategories, setOpenCategories] = useState<
    Record<string, boolean>
  >({});

  const rows = useMemo(
    () =>
      activeWishlist
        ? getEvaluationRows(home.id, activeWishlist.id)
        : [],
    // Provider-derived values intentionally drive recalculation.
    [activeWishlist?.id, activeRequirements, evaluations, home.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const progress = evaluationProgress(rows);
  const score = getScoreForHome(home.id);

  const groups = useMemo(() => {
    const map = new Map<WishlistCategory, EvaluationRow[]>();
    for (const category of CATEGORY_ORDER) map.set(category, []);
    for (const row of rows) {
      const list = map.get(row.requirement.category) ?? [];
      list.push(row);
      map.set(row.requirement.category, list);
    }
    return [...map.entries()].filter(([, items]) => items.length > 0);
  }, [rows]);

  function categoryStats(category: WishlistCategory) {
    const categoryRows = rows.filter(
      (row) => row.requirement.category === category,
    );
    const answered = categoryRows.filter(
      (row) => row.resolved !== "unknown",
    ).length;
    return { answered, total: categoryRows.length };
  }

  function choose(row: EvaluationRow, state: EvaluationState) {
    if (!activeWishlist) return;
    if (state === "unknown" && row.automatic !== "unknown") return;
    if (row.automatic === state) {
      // Confirming the automatic value clears any conflicting manual override.
      if (row.manual) {
        setEvaluation(
          home.id,
          activeWishlist.id,
          row.requirement.id,
          "unknown",
        );
      }
    } else {
      setEvaluation(
        home.id,
        activeWishlist.id,
        row.requirement.id,
        state,
      );
    }
    setSavedMessage(t("evaluate.saved"));
  }

  function scrollToCategory(category: WishlistCategory) {
    const element = document.getElementById(`eval-category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const scoreStatus =
    score?.status === "disqualified"
      ? t("compare.statusDisqualified")
      : score?.status === "missing-must"
        ? t("compare.statusMissing", { count: score.mustMissing.length })
        : score?.status === "awaiting-verification"
          ? t("compare.statusUnverified", {
              count: score.mustUnknown.length,
            })
          : score?.status === "meets-all-must"
            ? t("compare.statusMeetsAll")
            : score?.status === "no-must-haves"
              ? t("compare.statusNoMust")
              : t("compare.statusInsufficient");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label={t("common.goBack")} />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("evaluate.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            {t("evaluate.title")}
          </h1>
        </div>
      </header>

      <div className="px-6 pb-10">
        <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-line bg-white/55 p-3">
          <PropertyPhoto
            home={home}
            className="h-16 w-20 shrink-0 rounded-xl border border-line/70"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[17px] leading-tight text-ink">
              {home.address}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted">
              {home.city || t("common.cityToConfirm")}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {formatPriceOrPending(home.price, locale)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-line bg-parchment/70 px-4 py-3.5">
          <label
            htmlFor="evaluate-wishlist"
            className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
          >
            {t("evaluate.against")}
          </label>
          <select
            id="evaluate-wishlist"
            value={activeWishlist?.id ?? ""}
            onChange={(event) => setActiveWishlist(event.target.value)}
            className="mt-2 w-full appearance-none rounded-xl border border-line bg-white/70 px-3 py-2.5 text-[12px] text-ink outline-none focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
          >
            {wishlists.map((wishlist) => (
              <option key={wishlist.id} value={wishlist.id}>
                {translateWishlistName(wishlist.name, locale)}
              </option>
            ))}
          </select>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-olive transition-[width] duration-300"
                style={{ width: `${Math.min(100, progress.percent)}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-muted">
              {progress.answered}/{progress.total}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <p className="text-[10px] text-muted">
              {t("evaluate.progress", {
                answered: progress.answered,
                total: progress.total,
              })}
            </p>
            {progress.unanswered > 0 && (
              <p className="shrink-0 text-[10px] text-muted">
                {t("evaluate.unanswered", { count: progress.unanswered })}
              </p>
            )}
          </div>
        </div>

        {score && (
          <div className="mt-4 rounded-[22px] bg-olive p-4 text-cream">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-cream/80">
                  {t("evaluate.summary")}
                </p>
                <p className="mt-1 font-serif text-[26px] leading-none">
                  {score.disqualified
                    ? t("property.dealbreaker")
                    : score.score === null
                      ? t("compare.notEnough")
                      : `${score.scoreRounded}%`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.14em] text-cream/70">
                  {t("evaluate.coverage")}
                </p>
                <p className="mt-1 text-[13px] tabular-nums">
                  {Math.round(score.coverage)}%
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-cream/80">
              {scoreStatus}
            </p>
            <p className="mt-1 text-[9px] leading-4 text-cream/80">
              {t("evaluate.scoreNote")}
            </p>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="mt-4 rounded-[22px] border border-line bg-white/50 px-5 py-8 text-center">
            <p className="font-serif text-[18px] text-ink">
              {t("evaluate.noRequirements")}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              {t("evaluate.noRequirementsBody")}
            </p>
            <button
              type="button"
              onClick={onOpenWishlist}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-olive px-4 text-[11px] font-medium text-cream"
            >
              {t("evaluate.openWishlist")}
            </button>
          </div>
        ) : (
          <>
            <div
              className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1"
              role="group"
              aria-label={t("evaluate.categoryNav")}
            >
              {groups.map(([category]) => {
                const stats = categoryStats(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => scrollToCategory(category)}
                    className="min-h-10 shrink-0 rounded-full border border-line bg-white/60 px-3 text-[10px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
                  >
                    {t(categoryKey(category))}{" "}
                    <span className="tabular-nums text-muted">
                      {stats.answered}/{stats.total}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-4">
              {groups.map(([category, categoryRows]) => {
                const isOpen = openCategories[category] ?? true;
                return (
                  <section
                    key={category}
                    id={`eval-category-${category}`}
                    className="scroll-mt-4 overflow-hidden rounded-[22px] border border-line bg-white/50"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCategories((current) => ({
                          ...current,
                          [category]: !isOpen,
                        }))
                      }
                      aria-expanded={isOpen}
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30"
                    >
                      <span className="text-[12px] font-medium text-ink">
                        {t(categoryKey(category))}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] tabular-nums text-muted">
                        {categoryStats(category).answered}/
                        {categoryStats(category).total}
                        <ChevronDownIcon
                          className={[
                            "h-3.5 w-3.5 transition-transform",
                            isOpen ? "rotate-180" : "",
                          ].join(" ")}
                        />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-2 border-t border-line/70 p-2">
                        {categoryRows.map((row) => {
                          const selected = row.resolved;
                          const unknownDisabled = row.automatic !== "unknown";
                          return (
                            <article
                              key={row.requirement.id}
                              className="rounded-2xl border border-line/70 bg-white/55 p-3.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[12px] font-medium leading-4 text-ink">
                                    {translateRequirementName(
                                      row.requirement.name,
                                      locale,
                                    )}
                                  </p>
                                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[9.5px] text-muted">
                                    <span className="tabular-nums">
                                      {expectedLabel(
                                        row.requirement,
                                        locale,
                                        t,
                                      )}
                                    </span>
                                    <span className="text-muted/60">·</span>
                                    <span>
                                      {t(
                                        importanceKey(
                                          row.requirement.importance,
                                        ),
                                      )}
                                    </span>
                                  </p>
                                </div>
                                <StatusBadge
                                  state={selected}
                                  source={row.source}
                                  conflict={row.conflict}
                                />
                              </div>

                              {row.automatic !== "unknown" && (
                                <p className="mt-2 flex items-center gap-1.5 text-[9.5px] leading-4 text-muted">
                                  {row.automatic === "met" ? (
                                    <CheckIcon className="h-3 w-3 text-olive" />
                                  ) : (
                                    <XIcon className="h-3 w-3 text-clay" />
                                  )}
                                  {t("evaluate.detected")}:{" "}
                                  {row.automatic === "met"
                                    ? t("evaluate.meets")
                                    : t("evaluate.notMet")}
                                </p>
                              )}

                              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                                {(
                                  [
                                    {
                                      id: "met" as const,
                                      label: t("evaluate.meets"),
                                      Icon: CheckIcon,
                                      active:
                                        "border-olive bg-olive text-cream",
                                    },
                                    {
                                      id: "not-met" as const,
                                      label: t("evaluate.notMet"),
                                      Icon: XIcon,
                                      active: "border-clay bg-clay text-cream",
                                    },
                                    {
                                      id: "unknown" as const,
                                      label: t("evaluate.unknown"),
                                      Icon: QuestionIcon,
                                      active:
                                        "border-line bg-parchment text-ink",
                                    },
                                  ]
                                ).map((option) => {
                                  const isSelected = selected === option.id;
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => choose(row, option.id)}
                                      disabled={
                                        option.id === "unknown" &&
                                        unknownDisabled
                                      }
                                      aria-pressed={isSelected}
                                      aria-label={t("evaluate.optionAria", {
                                        state: option.label,
                                        name: translateRequirementName(
                                          row.requirement.name,
                                          locale,
                                        ),
                                      })}
                                      className={[
                                        "flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-1.5 text-[9.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 disabled:cursor-not-allowed disabled:opacity-35",
                                        isSelected
                                          ? option.active
                                          : "border-line bg-white/60 text-muted hover:text-ink",
                                      ].join(" ")}
                                    >
                                      <option.Icon className="h-3 w-3" />
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {row.conflict && (
                                <div className="mt-2.5 rounded-xl border border-clay/25 bg-clay/[0.06] px-3 py-2">
                                  <p className="text-[9.5px] leading-4 text-clay">
                                    {t("evaluate.conflict")}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={onOpenEdit}
                                    className="mt-1.5 inline-flex min-h-8 items-center gap-1 text-[9.5px] font-medium text-olive"
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                    {t("evaluate.correctData")}
                                  </button>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}

        <p
          aria-live="polite"
          className="mt-4 min-h-4 text-center text-[10px] text-olive"
        >
          {saving ? t("evaluate.saving") : savedMessage}
        </p>
      </div>

      <div className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-line bg-cream/95 px-5 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.12em] text-muted">
            {t("evaluate.progress", {
              answered: progress.answered,
              total: progress.total,
            })}
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-olive"
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 shrink-0 rounded-full bg-olive px-4 text-[12px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
        >
          {t("evaluate.saveProgress")}
        </button>
      </div>
    </div>
  );
}
