"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { useAppData } from "../../lib/app-data";
import { translateWishlistName, useI18n } from "../../lib/i18n";
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
  const {
    savedCount,
    upcomingTours,
    topMatches,
    status,
    v2Synced,
    evaluationsSynced,
    activeWishlist,
    wishlistProgress,
    configured,
    user,
    authReady,
    accountSynced,
    accountSyncError,
    signIn,
    signUp,
    signOut,
  } = useAppData();
  const { t, locale, setLocale } = useI18n();
  const topScored = topMatches[0];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  async function submitAccount(mode: "signin" | "signup") {
    if (authBusy) return;
    if (!email.trim() || !password) {
      setAuthMessage(t("more.accountFieldsRequired"));
      return;
    }
    setAuthBusy(true);
    setAuthMessage("");
    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);
    setAuthBusy(false);
    if (!result.ok) {
      setAuthMessage(result.error ?? t("more.accountError"));
      return;
    }
    if (result.confirmationRequired) {
      setAuthMessage(t("more.accountConfirmation"));
      return;
    }
    setPassword("");
    setAuthMessage(t("more.accountSynced"));
  }

  const searchRows: Row[] = [
    {
      label: t("more.compare"),
      detail:
        savedCount === 1
          ? t("common.savedHomeOne", { count: savedCount })
          : t("common.savedHomeMany", { count: savedCount }),
      Icon: HomesIcon,
      onClick: onOpenHomes,
    },
    {
      label: t("more.wishlist"),
      detail: t("more.wishlistDetail"),
      Icon: HeartIcon,
      onClick: onOpenWishlist,
    },
    {
      label: t("more.tourNotes"),
      detail: t("more.tourNotesDetail"),
      Icon: CalendarIcon,
      onClick: onOpenTour,
    },
    {
      label: t("more.neighborhood"),
      detail: t("more.neighborhoodDetail"),
      Icon: MapPinIcon,
      onClick: onOpenNeighborhood,
    },
    {
      label: t("more.budget"),
      detail: t("more.budgetDetail"),
      Icon: BudgetIcon,
      onClick: onOpenBudget,
    },
    {
      label: t("more.scoring"),
      detail: t("more.scoringDetail"),
      Icon: SparkleIcon,
      onClick: onOpenWishlist,
    },
  ];

  const soonRows: Row[] = [
    {
      label: t("more.documents"),
      detail: t("more.documentsDetail"),
      Icon: DocumentIcon,
      badge: t("more.soon"),
    },
    {
      label: t("more.cities"),
      detail: t("more.citiesDetail"),
      Icon: SparkleIcon,
      badge: t("more.soon"),
    },
    {
      label: t("more.settings"),
      detail: t("more.settingsDetail"),
      Icon: SettingsIcon,
      badge: t("more.soon"),
    },
  ];

  const languageOptions = [
    { id: "en" as const, label: t("more.english") },
    { id: "es" as const, label: t("more.spanish") },
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
          {t("more.eyebrow")}
        </p>
        <h1 className="mt-1 font-serif text-[36px] leading-none tracking-[-0.02em] text-ink">
          {t("more.title")}
        </h1>
      </header>

      <div className="px-6 pb-9">
        <div className="mt-6 flex items-center justify-between gap-3 rounded-[20px] border border-line bg-white/50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("more.language")}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-muted">
              {t("more.languageHint")}
            </p>
          </div>

          <div
            role="group"
            aria-label={t("more.language")}
            className="flex shrink-0 rounded-full border border-line bg-parchment p-0.5"
          >
            {languageOptions.map((option) => {
              const active = locale === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  lang={option.id}
                  onClick={() => setLocale(option.id)}
                  aria-pressed={active}
                  className={[
                    "min-h-9 rounded-full px-3 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40",
                    active
                      ? "bg-olive text-cream shadow-sm"
                      : "text-muted hover:text-ink",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-4 rounded-[20px] border border-line bg-white/50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("more.account")}
            </p>
            <span
              aria-hidden="true"
              className={[
                "h-1.5 w-1.5 rounded-full",
                accountSynced
                  ? "bg-olive"
                  : accountSyncError
                    ? "bg-gold"
                    : "bg-muted/40",
              ].join(" ")}
            />
          </div>

          {user ? (
            <>
              <p className="mt-2 text-[11px] font-medium text-ink">
                {t("more.accountSignedInAs", { email: user.email ?? "" })}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted">
                {accountSynced
                  ? t("more.accountSynced")
                  : accountSyncError
                    ? t("more.accountError")
                    : t("more.accountConnecting")}
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-2.5 min-h-9 rounded-full border border-line bg-white/70 px-3 text-[10px] font-medium text-ink"
              >
                {t("more.signOut")}
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-[10px] leading-4 text-muted">
                {t("more.accountHint")}
              </p>
              {!configured ? (
                <p className="mt-2 text-[10px] text-gold">
                  {t("more.accountUnavailable")}
                </p>
              ) : !authReady ? (
                <p className="mt-2 text-[10px] text-muted">
                  {t("more.accountConnecting")}
                </p>
              ) : (
                <form
                  className="mt-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitAccount("signin");
                  }}
                >
                  <label htmlFor="account-email" className="sr-only">
                    {t("more.email")}
                  </label>
                  <input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("more.email")}
                    className="w-full rounded-xl border border-line bg-white/75 px-3 py-2.5 text-[11.5px] text-ink outline-none placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
                  />
                  <label htmlFor="account-password" className="sr-only">
                    {t("more.password")}
                  </label>
                  <input
                    id="account-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("more.password")}
                    className="mt-2 w-full rounded-xl border border-line bg-white/75 px-3 py-2.5 text-[11.5px] text-ink outline-none placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
                  />
                  <p className="mt-1.5 text-[9px] text-muted">
                    {t("more.accountPasswordHint")}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={authBusy}
                      className="min-h-9 rounded-full bg-olive px-3 text-[10px] font-medium text-cream disabled:opacity-50"
                    >
                      {t("more.signIn")}
                    </button>
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={() => void submitAccount("signup")}
                      className="min-h-9 rounded-full border border-line bg-white/70 px-3 text-[10px] font-medium text-ink disabled:opacity-50"
                    >
                      {t("more.createAccount")}
                    </button>
                  </div>
                </form>
              )}
              {authMessage && (
                <p role="status" className="mt-2 text-[10px] leading-4 text-muted">
                  {authMessage}
                </p>
              )}
            </>
          )}
        </section>

        <div className="mt-4 rounded-[24px] bg-olive p-5 text-cream">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-cream/80">
              {t("more.summary")}
            </p>
            <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-cream/80">
              {t("more.active")}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: String(savedCount), label: t("more.savedHomes") },
              { value: String(upcomingTours), label: t("more.tours") },
              {
                value: topScored
                  ? t("compare.matchBadge", {
                      percent: topScored.score.scoreRounded ?? 0,
                    })
                  : "—",
                label: t("more.topMatch"),
              },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-[24px] leading-none">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-[9px] uppercase tracking-[0.08em] text-cream/80">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 border-t border-cream/10 pt-3 text-[10px] text-cream/80">
            {t("dashboard.activeWishlist")}:{" "}
            <span className="font-medium text-cream">
              {activeWishlist ? translateWishlistName(activeWishlist.name, locale) : "—"}
            </span>{" "}
            <span className="text-cream/80">
              · {wishlistProgress.configured}/{wishlistProgress.total}{" "}
              {t("dashboard.wishlistPreferences")}
            </span>
          </p>

          <p className="mt-3 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-cream/80">
            <span
              aria-hidden="true"
              className={[
                "h-1.5 w-1.5 rounded-full",
                accountSynced
                  ? "bg-cream/80"
                  : accountSyncError
                    ? "bg-gold"
                    : status === "synced"
                      ? "bg-cream/80"
                      : status === "local"
                        ? "bg-gold"
                        : "bg-cream/30",
              ].join(" ")}
            />
            {accountSynced
              ? t("more.accountSynced")
              : accountSyncError
                ? t("more.accountError")
                : status === "synced"
                  ? v2Synced
                    ? evaluationsSynced
                      ? t("more.synced")
                      : t("more.evaluationsLocal")
                    : t("more.v2Local")
                  : status === "local"
                    ? t("more.local")
                    : t("more.connecting")}
          </p>
        </div>

        <RowGroup title={t("more.yourSearch")} rows={searchRows} />
        <RowGroup title={t("more.comingSoon")} rows={soonRows} />

        <p className="mt-7 text-center text-[10px] leading-5 text-muted">
          The Next Home Edit
          <br />
          {t("more.version")}
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
                  onClick ? "bg-parchment text-olive" : "bg-sand/60 text-muted",
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
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
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
