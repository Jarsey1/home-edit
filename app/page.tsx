"use client";

import { useEffect, useState } from "react";
import { BottomNav, type TabId } from "./components/bottom-nav";
import { Dashboard } from "./components/dashboard";
import { BudgetScreen } from "./components/screens/budget-screen";
import { CompareScreen } from "./components/screens/compare-screen";
import { MoreScreen } from "./components/screens/more-screen";
import { NeighborhoodScreen } from "./components/screens/neighborhood-screen";
import { PropertyScreen } from "./components/screens/property-screen";
import { TourNotesScreen } from "./components/screens/tour-notes-screen";
import { WishlistScreen } from "./components/screens/wishlist-screen";
import { useAppData } from "./lib/app-data";

type OverlayType = "property" | "tour" | "neighborhood";

type Overlay = { type: OverlayType; homeId: string };

export default function HomeApp() {
  const { homes, topMatch } = useAppData();
  const [tab, setTab] = useState<TabId>("home");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const overlay = overlays[overlays.length - 1] ?? null;
  const overlayHome = overlay
    ? (homes.find((home) => home.id === overlay.homeId) ?? topMatch)
    : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, overlays.length]);

  function changeTab(next: TabId) {
    setOverlays([]);
    setTab(next);
  }

  function openProperty(homeId: string) {
    setOverlays([{ type: "property", homeId }]);
  }

  function pushOverlay(type: OverlayType, homeId: string) {
    setOverlays((current) => [...current, { type, homeId }]);
  }

  function goBack() {
    setOverlays((current) => current.slice(0, -1));
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line sm:shadow-[0_40px_90px_-35px_rgba(53,48,38,0.45)]">
      {overlay && overlayHome ? (
        <>
          {overlay.type === "property" && (
            <PropertyScreen
              home={overlayHome}
              onBack={goBack}
              onOpenTour={() => pushOverlay("tour", overlay.homeId)}
              onOpenNeighborhood={() =>
                pushOverlay("neighborhood", overlay.homeId)
              }
            />
          )}

          {overlay.type === "tour" && (
            <TourNotesScreen
              key={overlayHome.id}
              home={overlayHome}
              onBack={goBack}
            />
          )}

          {overlay.type === "neighborhood" && (
            <NeighborhoodScreen home={overlayHome} onBack={goBack} />
          )}
        </>
      ) : (
        <>
          {tab === "home" && (
            <Dashboard
              onOpenProperty={openProperty}
              onBrowseHomes={() => changeTab("homes")}
            />
          )}

          {tab === "homes" && (
            <CompareScreen onOpenProperty={openProperty} />
          )}

          {tab === "wishlist" && (
            <WishlistScreen
              onBack={() => changeTab("home")}
              onBrowseHomes={() => changeTab("homes")}
            />
          )}

          {tab === "budget" && (
            <BudgetScreen onBack={() => changeTab("home")} />
          )}

          {tab === "more" && (
            <MoreScreen
              onOpenHomes={() => changeTab("homes")}
              onOpenWishlist={() => changeTab("wishlist")}
              onOpenBudget={() => changeTab("budget")}
              onOpenTour={() => pushOverlay("tour", topMatch.id)}
              onOpenNeighborhood={() =>
                pushOverlay("neighborhood", topMatch.id)
              }
            />
          )}
        </>
      )}

      {!overlay && <BottomNav active={tab} onChange={changeTab} />}
    </div>
  );
}
