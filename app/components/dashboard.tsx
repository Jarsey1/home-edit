"use client";

import { useAppData } from "../lib/app-data";
import { formatPrice, formatPriceOrPending } from "../lib/homes";
import {
  translateWishlistName,
  useI18n,
  type TranslationKey,
} from "../lib/i18n";
import type { ScoreResult } from "../lib/scoring";
import { HouseIllustration } from "./house-illustration";
import { PropertyPhoto } from "./property-photo";
import {
  ArrowUpRightIcon,
  CheckIcon,
  HeartIcon,
  PlusIcon,
  QuestionIcon,
  SearchIcon,
} from "./icons";

function statusLabel(
  score: ScoreResult,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
) {
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

export function Dashboard({
  onOpenProperty,
  onBrowseHomes,
  onAddHome,
  onOpenWishlist,
}: {
  onOpenProperty: (homeId: string) => void;
  onBrowseHomes: () => void;
  onAddHome: () => void;
  onOpenWishlist: () => void;
}) {
  const {
    savedCount,
    upcomingTours,
    wishlistProgress,
    strongMatches,
    topMatches,
    homesNeedingEvaluation,
    activeWishlist,
    toggleSaved,
  } = useAppData();
  const { t, locale, number } = useI18n();

  const topScored = topMatches[0];
  const topHome = topScored?.home;
  const activeName = activeWishlist
    ? translateWishlistName(activeWishlist.name, locale)
    : "";

  const stats = [
    { value: String(savedCount), label: t("dashboard.savedHomes") },
    { value: String(upcomingTours), label: t("dashboard.upcomingTours") },
    {
      value: String(wishlistProgress.configured),
      label: t("dashboard.configuredPreferences"),
    },
    { value: String(strongMatches), label: t("dashboard.scoredHomes") },
  ];
  const progress = wishlistProgress.percent;
  const saved = topHome?.saved ?? false;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between gap-3 px-6 pt-9">
        <div>
          <h1 className="font-serif text-[36px] leading-[1.02] tracking-[-0.02em] text-ink">
            The Next
            <br />
            Home Edit
          </h1>
          <p className="mt-3 text-[13px] tracking-[0.01em] text-muted">
            {t("dashboard.tagline")}
          </p>
        </div>

        <div className="mt-1 flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onAddHome}
            aria-label={t("add.addHome")}
            className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-olive px-3.5 text-[12px] font-medium text-cream shadow-sm transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <PlusIcon className="h-4 w-4" />
            {t("add.addHome")}
          </button>

          <button
            type="button"
            onClick={onBrowseHomes}
            aria-label={t("dashboard.browseHomes")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-parchment/70 text-olive transition-colors hover:border-olive/30 hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
          >
            <SearchIcon className="h-[19px] w-[19px]" />
          </button>
        </div>
      </header>

      <section className="mt-7 px-6">
        <div className="rounded-[26px] border border-line bg-parchment px-5 pb-5 pt-4">
          <button
            type="button"
            onClick={onOpenWishlist}
            className="flex w-full items-start justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
          >
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                {t("dashboard.activeWishlist")}
              </span>
              <span className="mt-1 block truncate font-serif text-[22px] leading-tight tracking-[-0.01em] text-ink">
                {activeName || t("wishlist.noRequirements")}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-white/60 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-muted">
              {t("wishlist.active")}
            </span>
          </button>

          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("dashboard.setupProgress")}
            </p>
            <p className="text-[13px] font-medium tracking-[0.03em] text-olive">
              {wishlistProgress.configured}
              <span className="text-muted">/{wishlistProgress.total}</span>
            </p>
          </div>

          <div
            role="progressbar"
            aria-label={t("dashboard.progressAria")}
            aria-valuemin={0}
            aria-valuemax={wishlistProgress.total}
            aria-valuenow={wishlistProgress.configured}
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-sand"
          >
            <div
              className="h-full rounded-full bg-olive transition-[width] duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-muted">
            {t("dashboard.setupHint")}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line/70 pt-4">
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
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-[23px] tracking-[-0.01em] text-ink">
            {t("dashboard.yourTopMatch")}
          </h2>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
            {strongMatches === 1
              ? t("common.matchCountOne", { count: strongMatches })
              : t("common.matchCountMany", { count: strongMatches })}
          </span>
        </div>

        {!topScored || !topHome ? (
          <div className="mt-4 rounded-[24px] border border-line bg-white/55 px-5 py-9 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-parchment text-olive">
              <QuestionIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-[20px] leading-tight text-ink">
              {t("dashboard.noScores")}
            </p>
            <p className="mt-2 text-[11.5px] leading-5 text-muted">
              {t("dashboard.noScoresBody")}
            </p>
            <button
              type="button"
              onClick={onBrowseHomes}
              className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-olive px-4 text-[11px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {t("dashboard.viewMatches")}
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <article className="mt-4 overflow-hidden rounded-[28px] border border-line bg-white/55">
            <div className="relative h-44">
              <button
                type="button"
                onClick={() => onOpenProperty(topHome.id)}
                aria-label={t("common.view", { address: topHome.address })}
                className="absolute inset-0 block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/40"
              >
                <PropertyPhoto home={topHome} className="h-full w-full" />
              </button>

              <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-cream/95 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-olive shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-olive" />
                {t("property.matchWithCoverage", {
                  percent: topScored.score.scoreRounded ?? 0,
                  coverage: Math.round(topScored.score.coverage),
                })}
              </span>

              <button
                type="button"
                onClick={() => toggleSaved(topHome.id)}
                aria-label={
                  saved
                    ? t("common.removeAddress", { address: topHome.address })
                    : t("property.saveHome")
                }
                aria-pressed={saved}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-olive shadow-sm backdrop-blur transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/80"
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
                    {topHome.address}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                    {topHome.city || t("common.cityToConfirm")}
                  </p>
                </div>
                <p className="shrink-0 font-serif text-[21px] leading-tight text-ink">
                  {formatPriceOrPending(topHome.price, locale)}
                </p>
              </div>

              <p className="mt-4 text-[13px] text-muted">
                {topHome.beds > 0
                  ? t("dashboard.bedsValue", { count: topHome.beds })
                  : t("dashboard.bedsEmpty")}{" "}
                <span className="px-1 text-muted/50">·</span>{" "}
                {topHome.baths > 0
                  ? t("dashboard.bathsValue", { count: topHome.baths })
                  : t("dashboard.bathsEmpty")}{" "}
                <span className="px-1 text-muted/50">·</span>{" "}
                {topHome.sqft > 0
                  ? t("dashboard.sqftValue", { value: number(topHome.sqft) })
                  : t("dashboard.sqftEmpty")}
              </p>

              <div className="mt-4 rounded-2xl bg-parchment/70 px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] leading-4 text-muted">
                    {t("compare.basedOn", {
                      percent: Math.round(topScored.score.coverage),
                    })}
                  </p>
                  <p className="shrink-0 text-[10px] tabular-nums text-olive">
                    {topScored.score.mustMet.length}/{topScored.score.mustTotal}{" "}
                    {t("compare.mustMet")}
                  </p>
                </div>
                <p
                  className={[
                    "mt-1.5 text-[10.5px] leading-4",
                    topScored.score.status === "meets-all-must" ||
                    topScored.score.status === "no-must-haves"
                      ? "text-olive"
                      : topScored.score.status === "missing-must"
                        ? "text-clay"
                        : "text-muted",
                  ].join(" ")}
                >
                  {statusLabel(topScored.score, t)}
                </p>
                {topScored.monthlyCost !== null && (
                  <p className="mt-1 text-[10px] tabular-nums text-muted">
                    {t("compare.monthlyCost")}:{" "}
                    {formatPrice(Math.round(topScored.monthlyCost), locale)}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line/80 pt-4">
                <span className="text-[11px] tracking-[0.02em] text-muted">
                  {t("dashboard.matchScoresLive")}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenProperty(topHome.id)}
                  className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  {t("dashboard.viewDetails")}
                  <ArrowUpRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          </article>
        )}

        {topMatches.length > 1 && (
          <div className="mt-3 space-y-2">
            {topMatches.slice(1, 3).map((entry) => (
              <button
                key={entry.home.id}
                type="button"
                onClick={() => onOpenProperty(entry.home.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/50 px-3 py-2.5 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
              >
                <PropertyPhoto
                  home={entry.home}
                  className="h-12 w-14 shrink-0 rounded-xl border border-line/70"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-medium text-ink">
                    {entry.home.address}
                  </span>
                  <span className="mt-0.5 block text-[9.5px] text-muted">
                    {t("compare.basedOn", {
                      percent: Math.round(entry.score.coverage),
                    })}
                  </span>
                </span>
                <span className="shrink-0 font-serif text-[17px] leading-none text-ink">
                  {entry.score.scoreRounded}%
                </span>
              </button>
            ))}
          </div>
        )}

        {homesNeedingEvaluation.length > 0 && (
          <section className="mt-7">
            <h2 className="font-serif text-[20px] tracking-[-0.01em] text-ink">
              {t("dashboard.homesNeedingEvaluation")}
            </h2>
            <p className="mt-1 text-[10.5px] leading-4 text-muted">
              {t("dashboard.needsEvaluationBody", { wishlist: activeName })}
            </p>
            <div className="mt-3 space-y-2">
              {homesNeedingEvaluation.slice(0, 3).map((entry) => (
                <button
                  key={entry.home.id}
                  type="button"
                  onClick={() => onOpenProperty(entry.home.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/45 px-3 py-2.5 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
                >
                  <PropertyPhoto
                    home={entry.home}
                    className="h-11 w-12 shrink-0 rounded-lg border border-line/70"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-ink">
                      {entry.home.address}
                    </span>
                    <span className="mt-0.5 block text-[9.5px] text-muted">
                      {entry.score.score === null
                        ? t("compare.statusInsufficient")
                        : t("dashboard.evaluated", {
                            percent: Math.round(entry.score.coverage),
                          })}
                    </span>
                  </span>
                  <QuestionIcon className="h-4 w-4 shrink-0 text-muted" />
                </button>
              ))}
            </div>
          </section>
        )}

        {topMatches.length > 0 && homesNeedingEvaluation.length === 0 && (
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted">
            <CheckIcon className="h-3 w-3 text-olive" />
            {t("dashboard.matchScoresLive")}
          </p>
        )}

        <div className="mt-7 flex justify-center">
          <HouseIllustration className="h-10 w-16 opacity-30" />
        </div>
      </section>
    </div>
  );
}
