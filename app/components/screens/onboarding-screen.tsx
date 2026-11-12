"use client";

import { useAppData } from "../../lib/app-data";
import { useI18n } from "../../lib/i18n";

export function OnboardingScreen({
  onStart,
}: {
  onStart: (destination: "home" | "wishlist") => void;
}) {
  const { createWishlist } = useAppData();
  const { t } = useI18n();

  function create(destination: "home" | "wishlist") {
    const wishlist = createWishlist(
      t("onboarding.wishlistName"),
      null,
      true,
      false,
    );
    if (!wishlist) return;
    onStart(destination);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream px-6 py-10 sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line sm:shadow-[0_40px_90px_-35px_rgba(53,48,38,0.45)]">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-olive text-cream">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6" aria-hidden="true">
            <path d="M3.5 10.4 12 3.5l8.5 6.9" />
            <path d="M5.5 9.2V20a.8.8 0 0 0 .8.8h4.1v-6.2h3.2v6.2h4.1a.8.8 0 0 0 .8-.8V9.2" />
          </svg>
        </div>
        <p className="mt-7 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          {t("onboarding.eyebrow")}
        </p>
        <h1 className="mt-2 text-center font-serif text-[32px] leading-[1.08] tracking-[-0.02em] text-ink">
          {t("onboarding.title")}
        </h1>
        <p className="mt-3 text-center text-[12px] leading-5 text-muted">
          {t("onboarding.body")}
        </p>

        <div className="mt-8 space-y-2.5">
          <button
            type="button"
            onClick={() => create("wishlist")}
            className="min-h-11 w-full rounded-full bg-olive px-4 text-[12px] font-medium text-cream"
          >
            {t("onboarding.createWishlist")}
          </button>
          <button
            type="button"
            onClick={() => create("home")}
            className="min-h-11 w-full rounded-full border border-line bg-white/60 px-4 text-[12px] font-medium text-ink"
          >
            {t("onboarding.explore")}
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-[9px] leading-4 text-muted">
        {t("welcome.privacyNote")}
      </p>
    </main>
  );
}
