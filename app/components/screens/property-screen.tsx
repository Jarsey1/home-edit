"use client";

import { useState } from "react";
import { useAppData } from "../../lib/app-data";
import {
  formatGarageLabel,
  formatLotLabel,
  formatPrice,
  formatPriceOrPending,
  type Home,
} from "../../lib/homes";
import {
  translatePropertyType,
  translateWishlistName,
  translateWishlistText,
  useI18n,
  type TranslationKey,
} from "../../lib/i18n";
import type { ScoreResult } from "../../lib/scoring";
import { PropertyPhoto } from "../property-photo";
import { BackButton } from "../back-button";
import { Sheet } from "../sheet";
import {
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  HeartIcon,
  MapPinIcon,
  PencilIcon,
  QuestionIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from "../icons";

function matchStatus(score: ScoreResult, t: (key: TranslationKey, vars?: Record<string, string | number>) => string) {
  switch (score.status) {
    case "disqualified":
      return t("compare.statusDisqualified");
    case "missing-must":
      return t("compare.statusMissing", { count: score.mustMissing.length });
    case "awaiting-verification":
      return t("compare.statusUnverified", { count: score.mustUnknown.length });
    case "meets-all-must":
      return t("compare.statusMeetsAll");
    case "no-must-haves":
      return t("compare.statusNoMust");
    default:
      return t("compare.statusInsufficient");
  }
}

export function PropertyScreen({
  home,
  onBack,
  onOpenTour,
  onOpenNeighborhood,
  onOpenEdit,
  onOpenBudget,
  onEvaluate,
}: {
  home: Home;
  onBack: () => void;
  onOpenTour: () => void;
  onOpenNeighborhood: () => void;
  onOpenEdit: () => void;
  onOpenBudget: () => void;
  onEvaluate: () => void;
}) {
  const {
    toggleSaved,
    setTourRequested,
    toggleFavorite,
    removeHome,
    getScoreForHome,
    getMonthlyCostForHome,
    getBudgetEstimateForHome,
    activeWishlist,
    tourNotes,
  } = useAppData();
  const { t, locale, number } = useI18n();
  const [shareMessage, setShareMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saved = home.saved;
  const scheduled = home.tourRequested;
  const favorite = Boolean(home.favorite);
  const score = getScoreForHome(home.id);
  const monthlyCost = getMonthlyCostForHome(home.id);
  const budgetEstimate = getBudgetEstimateForHome(home.id);
  const note = tourNotes[home.id];

  const specs = [
    { value: home.beds > 0 ? home.beds : "—", label: t("common.beds") },
    { value: home.baths > 0 ? home.baths : "—", label: t("common.baths") },
    {
      value: home.sqft > 0 ? number(home.sqft) : "—",
      label: t("common.sqft"),
    },
    {
      value: formatLotLabel(home.lot, locale) || "—",
      label: t("common.lot"),
    },
  ];

  const details = [
    {
      label: t("property.type"),
      value: translatePropertyType(home.type, locale) || "—",
    },
    {
      label: t("common.yearBuilt"),
      value: home.yearBuilt > 0 ? String(home.yearBuilt) : "—",
    },
    {
      label: t("property.hoa"),
      value:
        home.hoa > 0
          ? t("property.hoaMonthly", { amount: number(home.hoa) })
          : "—",
    },
    {
      label: t("property.daysOnMarket"),
      value:
        home.daysOnMarket > 0
          ? t("property.daysValue", { count: home.daysOnMarket })
          : "—",
    },
    {
      label: t("common.garage"),
      value: formatGarageLabel(home.garage, locale) || "—",
    },
    {
      label: t("property.tourDate"),
      value: home.tourDate || t("property.tourDateNone"),
    },
  ];

  async function share() {
    setShareMessage("");
    const url = home.listingUrl;
    if (!url) {
      setShareMessage(t("property.shareUnavailable"));
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: home.address, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMessage(t("property.shareCopied"));
      }
    } catch {
      // The user dismissed the share sheet; nothing to do.
    }
  }

  function confirmRemove() {
    removeHome(home.id);
    setConfirmDelete(false);
    onBack();
  }

  const scoreTitle = !score
    ? t("property.notScored")
    : score.disqualified
      ? t("compare.statusDisqualified")
      : score.score === null
        ? t("property.notScored")
        : `${score.scoreRounded}%`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-[298px] w-full shrink-0">
        <PropertyPhoto
          home={home}
          className="absolute inset-0 h-full w-full"
          filter={!home.photo}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/30" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-7">
          <BackButton onClick={onBack} label={t("common.goBack")} />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={share}
              aria-label={t("property.share")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/40 bg-cream/90 text-olive backdrop-blur transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
            >
              <ShareIcon className="h-[17px] w-[17px]" />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(home.id)}
              aria-label={favorite ? t("property.unfavorite") : t("property.favorite")}
              aria-pressed={favorite}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/40 bg-cream/90 text-olive backdrop-blur transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
            >
              <StarIcon
                className={["h-[17px] w-[17px]", favorite ? "fill-current" : ""].join(
                  " ",
                )}
              />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-7 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={[
                "rounded-full px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] backdrop-blur",
                score?.disqualified
                  ? "bg-clay/95 text-cream"
                  : "bg-cream/95 text-olive",
              ].join(" ")}
            >
              {score?.score !== null && score?.score !== undefined && !score.disqualified
                ? t("property.matchWithCoverage", {
                    percent: score.scoreRounded ?? 0,
                    coverage: Math.round(score.coverage),
                  })
                : score?.disqualified
                  ? t("property.dealbreaker")
                  : t("compare.notEnough")}
            </span>
            <span className="rounded-full border border-cream/40 bg-ink/25 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] text-cream backdrop-blur">
              {t("common.forSale")}
            </span>
            {favorite && (
              <span className="rounded-full border border-cream/40 bg-ink/25 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] text-cream backdrop-blur">
                {t("property.favoriteBadge")}
              </span>
            )}
          </div>
          <span className="shrink-0 rounded-full border border-cream/35 bg-ink/25 px-2.5 py-1.5 text-[9px] tracking-[0.08em] text-cream backdrop-blur">
            {saved ? t("common.saved") : t("common.newListing")}
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
              {home.city || t("common.cityToConfirm")}
            </p>
          </div>
          <p className="shrink-0 pt-1 font-serif text-[22px] leading-tight text-ink">
            {formatPriceOrPending(home.price, locale)}
          </p>
        </div>

        {shareMessage && (
          <p role="status" className="mt-2 text-[10px] text-muted">
            {shareMessage}
          </p>
        )}

        <section className="mt-5 rounded-[22px] border border-line bg-white/55 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("property.matchSection")}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                {activeWishlist
                  ? t("compare.currentWishlist", {
                      name: translateWishlistName(activeWishlist.name, locale),
                    })
                  : ""}
              </p>
            </div>
            {score && (
              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.08em]",
                  score.disqualified
                    ? "bg-clay/10 text-clay"
                    : score.score === null
                      ? "bg-parchment text-muted"
                      : "bg-olive/[0.08] text-olive",
                ].join(" ")}
              >
                {score.disqualified
                  ? t("property.dealbreaker")
                  : score.score === null
                    ? t("compare.notEnough")
                    : t("property.matchWithCoverage", {
                        percent: score.scoreRounded ?? 0,
                        coverage: Math.round(score.coverage),
                      })}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p
                className={[
                  "font-serif leading-none",
                  score?.disqualified
                    ? "text-[21px] leading-tight text-clay"
                    : "text-[32px] text-ink",
                ].join(" ")}
              >
                {scoreTitle}
              </p>
              <p className="mt-1.5 text-[10px] leading-4 text-muted">
                {score && score.score !== null
                  ? t("property.matchCoverage", {
                      percent: Math.round(score.coverage),
                    })
                  : t("compare.statusInsufficient")}
              </p>
            </div>
            {monthlyCost !== null && (
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.1em] text-muted">
                  {t("compare.monthlyCost")}
                </p>
                <p className="mt-1 text-[12px] tabular-nums text-ink/90">
                  {formatPrice(Math.round(monthlyCost), locale)}
                </p>
                <p className="text-[8.5px] text-muted">{t("compare.estimated")}</p>
              </div>
            )}
          </div>

          {score && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line/70 pt-3 text-[10px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <CheckIcon className="h-3 w-3 text-olive" />
                  {score.mustTotal > 0
                    ? t("property.mustSummary", {
                        met: score.mustMet.length,
                        total: score.mustTotal,
                      })
                    : t("compare.noMustConfigured")}
                </span>
                {score.mustUnknown.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <QuestionIcon className="h-3 w-3" />
                    {t("property.unverified", {
                      count: score.mustUnknown.length,
                    })}
                  </span>
                )}
                {score.mustMissing.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-clay">
                    <XIcon className="h-3 w-3" />
                    {t("compare.statusMissing", {
                      count: score.mustMissing.length,
                    })}
                  </span>
                )}
              </div>
              <p
                className={[
                  "mt-2 text-[10px] leading-4",
                  score.disqualified
                    ? "text-clay"
                    : score.status === "meets-all-must" ||
                        score.status === "no-must-haves"
                      ? "text-olive"
                      : "text-muted",
                ].join(" ")}
              >
                {matchStatus(score, t)}
              </p>
              {score.score !== null && score.coverage < 80 && (
                <p className="mt-1 text-[9.5px] leading-4 text-muted">
                  {t("property.factsMissing")}
                </p>
              )}
              {budgetEstimate?.status === "partial" && (
                <p className="mt-1 text-[9.5px] leading-4 text-clay">
                  {t("property.budgetPartial")}
                </p>
              )}
              {budgetEstimate?.status === "assumptions" && (
                <p className="mt-1 text-[9.5px] leading-4 text-muted">
                  {t("property.budgetAssumptions")}
                </p>
              )}
            </>
          )}
        </section>

        <div className="mt-5">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
            {t("property.facts")}
          </p>
          <div className="mt-2 grid grid-cols-4 rounded-2xl border border-line bg-white/50 py-3">
            {specs.map((spec, index) => (
              <div
                key={spec.label}
                className={[
                  "px-1 text-center",
                  index > 0 ? "border-l border-line/70" : "",
                ].join(" ")}
              >
                <p className="font-serif text-[17px] leading-none text-ink">
                  {spec.value}
                </p>
                <p className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-muted">
                  {spec.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-6">
          <h2 className="font-serif text-[19px] text-ink">
            {t("property.about")}
          </h2>
          <p className="mt-2 text-[12px] leading-[1.7] text-muted">
            {home.description || t("property.noDescription")}
          </p>
        </section>

        {home.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {home.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-line bg-parchment/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-muted"
              >
                {translateWishlistText(feature, locale)}
              </span>
            ))}
          </div>
        )}

        {home.notes && (
          <section className="mt-6">
            <h2 className="font-serif text-[19px] text-ink">
              {t("property.personalNotes")}
            </h2>
            <p className="mt-2 whitespace-pre-line rounded-2xl border border-line bg-parchment/60 px-4 py-3 text-[12px] leading-5 text-ink/80">
              {home.notes}
            </p>
          </section>
        )}

        {note && (note.notes || note.pros.length > 0 || note.cons.length > 0) && (
          <section className="mt-6">
            <h2 className="font-serif text-[19px] text-ink">{t("tour.notes")}</h2>
            {note.notes && (
              <p className="mt-2 text-[12px] leading-5 text-muted">{note.notes}</p>
            )}
            {note.pros.length > 0 && (
              <ul className="mt-2 space-y-1">
                {note.pros.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-ink/80">
                    <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-olive" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {note.cons.length > 0 && (
              <ul className="mt-2 space-y-1">
                {note.cons.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-ink/80">
                    <XIcon className="mt-0.5 h-3 w-3 shrink-0 text-clay" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {home.listingUrl && (
          <a
            href={home.listingUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-white/50 px-4 py-3 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-parchment text-olive">
              <ExternalLinkIcon className="h-[17px] w-[17px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-ink">
                {t("property.listing")}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-muted">
                {home.listingUrl}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
          </a>
        )}

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={onEvaluate}
            className="flex w-full items-center gap-3 rounded-2xl border border-olive/25 bg-olive/[0.06] px-4 py-3.5 text-left transition-colors hover:bg-olive/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive text-cream">
              <CheckIcon className="h-[17px] w-[17px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-ink">
                {t("property.evaluate")}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                {t("property.evaluateDetail")}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-olive/70" />
          </button>

          <button
            type="button"
            onClick={onOpenEdit}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/50 px-4 py-3.5 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-parchment text-olive">
              <PencilIcon className="h-[17px] w-[17px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-ink">
                {t("property.edit")}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                {t("property.editAria", { address: home.address })}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
          </button>

          <button
            type="button"
            onClick={onOpenBudget}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/50 px-4 py-3.5 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-parchment text-olive">
              <span className="font-serif text-[15px]">$</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-ink">
                {t("property.budget")}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                {t("property.budgetDetail")}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
          </button>

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
                {t("more.tourNotes")}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                {t("property.tourDetail")}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
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
                {t("more.neighborhood")}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                {t("property.neighborhoodDetail")}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
          </button>
        </div>

        <section className="mt-6">
          <h2 className="font-serif text-[19px] text-ink">
            {t("property.details")}
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white/50">
            {details.map((detail, index) => (
              <div
                key={detail.label}
                className={[
                  "flex items-center justify-between gap-3 px-4 py-3 text-[11px]",
                  index > 0 ? "border-t border-line/70" : "",
                ].join(" ")}
              >
                <span className="text-muted">{detail.label}</span>
                <span className="text-right text-ink/90">{detail.value}</span>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white/50 px-4 text-[11px] font-medium text-muted transition-colors hover:border-clay/30 hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/30"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          {t("property.deleteHome")}
        </button>
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
              {t("property.tourRequested")}
            </>
          ) : (
            <>
              <CalendarIcon className="h-4 w-4" />
              {t("property.scheduleTour")}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => toggleSaved(home.id)}
          aria-pressed={saved}
          className={[
            "flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-4 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40",
            saved
              ? "border-olive bg-olive/10 text-olive"
              : "border-line bg-transparent text-ink/80 hover:bg-parchment",
          ].join(" ")}
        >
          <HeartIcon
            className={["h-4 w-4", saved ? "fill-current" : ""].join(" ")}
          />
          {saved ? t("common.saved") : t("common.save")}
        </button>
      </div>

      <Sheet
        open={confirmDelete}
        title={t("property.deleteTitle", { address: home.address })}
        onClose={() => setConfirmDelete(false)}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="min-h-11 flex-1 rounded-full border border-line bg-white/70 text-[12px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              {t("property.keepHome")}
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              className="min-h-11 flex-1 rounded-full bg-clay text-[12px] font-medium text-cream transition-colors hover:bg-clay/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            >
              {t("common.remove")}
            </button>
          </div>
        }
      >
        <p className="text-[12px] leading-5 text-muted">
          {t("property.deleteBody")}
        </p>
      </Sheet>
    </div>
  );
}
