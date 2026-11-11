"use client";

import { useEffect, useState } from "react";
import { BottomNav, type TabId } from "./components/bottom-nav";
import { Dashboard } from "./components/dashboard";
import { AddHomeScreen } from "./components/screens/add-home-screen";
import { BudgetScreen } from "./components/screens/budget-screen";
import { CitiesScreen } from "./components/screens/cities-screen";
import { CompareScreen } from "./components/screens/compare-screen";
import { EditPropertyScreen } from "./components/screens/edit-property-screen";
import { EvaluateScreen } from "./components/screens/evaluate-screen";
import { MoreScreen } from "./components/screens/more-screen";
import { OnboardingScreen } from "./components/screens/onboarding-screen";
import { NeighborhoodScreen } from "./components/screens/neighborhood-screen";
import { PropertyScreen } from "./components/screens/property-screen";
import { SettingsScreen } from "./components/screens/settings-screen";
import { TourNotesScreen } from "./components/screens/tour-notes-screen";
import { WelcomeScreen } from "./components/screens/welcome-screen";
import { WishlistScreen } from "./components/screens/wishlist-screen";
import { useAppData } from "./lib/app-data";
import { buildInfo } from "./lib/build-info";
import { useI18n } from "./lib/i18n";

type Overlay =
  | {
      type:
        | "property"
        | "tour"
        | "neighborhood"
        | "edit-home"
        | "budget-property"
        | "evaluate"
        | "cities";
      homeId: string;
      featureKey?: string;
    }
  | { type: "add-home" }
  | { type: "budget" }
  | { type: "settings" };

type OverlayType = Exclude<Overlay["type"], "add-home" | "budget">;

export default function HomeApp() {
  const {
    homes,
    topMatch,
    user,
    authReady,
    accountReady,
    accountSyncError,
    wishlists,
    signOut,
  } = useAppData();
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("home");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [wishlistFocus, setWishlistFocus] = useState<string | null>(null);
  const overlay = overlays[overlays.length - 1] ?? null;
  const overlayHome =
    overlay && "homeId" in overlay
      ? (homes.find((home) => home.id === overlay.homeId) ?? topMatch)
      : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, overlays.length]);

  function changeTab(next: TabId) {
    setOverlays([]);
    setWishlistFocus(null);
    setTab(next);
  }

  function openProperty(homeId: string) {
    setOverlays([{ type: "property", homeId }]);
  }

  function openPropertyEvaluation(homeId: string) {
    setOverlays([{ type: "evaluate", homeId }]);
  }

  function openWishlistRequirement(requirementId: string) {
    changeTab("wishlist");
    setWishlistFocus(requirementId);
  }

  function pushOverlay(type: OverlayType, homeId: string) {
    setOverlays((current) => [...current, { type, homeId }]);
  }

  function goBack() {
    setOverlays((current) => current.slice(0, -1));
  }

  const stagingBanner =
    buildInfo.environment === "staging" ? (
      <div
        role="note"
        className="mx-4 mt-3 rounded-xl border border-gold/35 bg-gold/10 px-3 py-2 text-[9.5px] leading-4 text-[#6b5535]"
      >
        <span className="mr-1 font-semibold uppercase tracking-[0.08em]">
          {t("staging.badge")}
        </span>{" "}
        {t("staging.warning")}
      </div>
    ) : null;

  if (!authReady) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center bg-cream px-6 sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line">
        <p className="font-serif text-[28px] tracking-[-0.02em] text-ink">
          The Next Home Edit
        </p>
        <p className="mt-3 text-[11px] text-muted">{t("auth.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <>
        {stagingBanner}
        <WelcomeScreen />
      </>
    );
  }

  if (!accountReady && !accountSyncError) {
    return (
      <>
        {stagingBanner}
        <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center bg-cream px-6 sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line">
          <p className="font-serif text-[28px] tracking-[-0.02em] text-ink">
            The Next Home Edit
          </p>
          <p className="mt-3 text-[11px] text-muted">{t("auth.loadingAccount")}</p>
        </main>
      </>
    );
  }

  if (accountSyncError) {
    return (
      <>
        {stagingBanner}
        <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-cream px-6 sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line">
          <p className="font-serif text-[28px] leading-tight tracking-[-0.02em] text-ink">
            {t("auth.accountErrorTitle")}
          </p>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            {t("auth.accountErrorBody")}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 min-h-10 w-full rounded-full border border-line bg-white/70 text-[11px] font-medium text-ink"
          >
            {t("more.signOut")}
          </button>
        </main>
      </>
    );
  }

  if (wishlists.length === 0) {
    return (
      <>
        {stagingBanner}
        <OnboardingScreen
          onStart={(destination) => changeTab(destination)}
        />
      </>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line sm:shadow-[0_40px_90px_-35px_rgba(53,48,38,0.45)]">
      {stagingBanner}
      <main className="flex flex-1 flex-col">
      {overlay ? (
        <>
          {overlay.type === "add-home" && (
            <AddHomeScreen onBack={goBack} onAdded={openProperty} />
          )}

          {overlay.type === "budget" && <BudgetScreen onBack={goBack} />}

          {overlay.type === "cities" && <CitiesScreen onBack={goBack} />}

          {overlay.type === "settings" && <SettingsScreen onBack={goBack} />}

          {"homeId" in overlay && overlayHome && (
            <>
              {overlay.type === "property" && (
                <PropertyScreen
                  home={overlayHome}
                  onBack={goBack}
                  onOpenTour={() => pushOverlay("tour", overlay.homeId)}
                  onOpenNeighborhood={() =>
                    pushOverlay("neighborhood", overlay.homeId)
                  }
                  onOpenEdit={() => pushOverlay("edit-home", overlay.homeId)}
                  onOpenBudget={() =>
                    pushOverlay("budget-property", overlay.homeId)
                  }
                  onEvaluate={() => pushOverlay("evaluate", overlay.homeId)}
                />
              )}

              {overlay.type === "evaluate" && (
                <EvaluateScreen
                  key={overlay.homeId}
                  home={overlayHome}
                  onBack={goBack}
                  onOpenWishlist={() => changeTab("wishlist")}
                  onOpenEdit={() => pushOverlay("edit-home", overlay.homeId)}
                />
              )}

              {overlay.type === "edit-home" && (
                <EditPropertyScreen
                  key={overlay.homeId}
                  home={overlayHome}
                  onBack={goBack}
                  focusFeatureKey={overlay.featureKey ?? null}
                />
              )}

              {overlay.type === "budget-property" && (
                <BudgetScreen
                  key={overlay.homeId}
                  property={overlayHome}
                  onBack={goBack}
                />
              )}

              {overlay.type === "tour" && (
                <TourNotesScreen
                  key={overlayHome.id}
                  home={overlayHome}
                  homes={homes}
                  onSelectHome={(homeId) =>
                    setOverlays((current) => [
                      ...current.slice(0, -1),
                      { type: "tour", homeId },
                    ])
                  }
                  onBack={goBack}
                />
              )}

              {overlay.type === "neighborhood" && (
                <NeighborhoodScreen home={overlayHome} onBack={goBack} />
              )}
            </>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col pb-[calc(4.75rem+env(safe-area-inset-bottom))]">
          {tab === "home" && (
            <Dashboard
              onOpenProperty={openProperty}
              onBrowseHomes={() => changeTab("homes")}
              onAddHome={() => setOverlays([{ type: "add-home" }])}
              onOpenWishlist={() => changeTab("wishlist")}
              onEvaluate={openPropertyEvaluation}
            />
          )}

          {tab === "homes" && (
            <CompareScreen
              onOpenProperty={openProperty}
              onOpenBudget={(homeId) =>
                setOverlays([{ type: "budget-property", homeId }])
              }
              onOpenWishlist={() => changeTab("wishlist")}
              onEvaluate={openPropertyEvaluation}
              onEditProperty={(homeId, featureKey) =>
                setOverlays([{ type: "edit-home", homeId, featureKey }])
              }
              onOpenRequirement={openWishlistRequirement}
              onAddHome={() => setOverlays([{ type: "add-home" }])}
            />
          )}

          {tab === "wishlist" && (
            <WishlistScreen
              onBack={() => changeTab("home")}
              onBrowseHomes={() => changeTab("homes")}
              focusRequirementId={wishlistFocus}
            />
          )}

          {tab === "more" && (
            <MoreScreen
              onOpenHomes={() => changeTab("homes")}
              onOpenWishlist={() => changeTab("wishlist")}
              onOpenBudget={() => setOverlays([{ type: "budget" }])}
              onOpenTour={() => {
                if (homes.length === 0) {
                  changeTab("homes");
                  return;
                }
                pushOverlay("tour", topMatch.id);
              }}
              onOpenNeighborhood={() => {
                if (homes.length === 0) {
                  changeTab("homes");
                  return;
                }
                pushOverlay("neighborhood", topMatch.id);
              }}
              onOpenCities={() => pushOverlay("cities", topMatch.id)}
              onOpenSettings={() => setOverlays([{ type: "settings" }])}
            />
          )}
        </div>
      )}
      </main>

      {!overlay && <BottomNav active={tab} onChange={changeTab} />}
    </div>
  );
}
