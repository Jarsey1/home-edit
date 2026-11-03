"use client";

import { useState } from "react";
import { useAppData } from "../../lib/app-data";
import { formatExcludedCity } from "../../lib/locations";
import { translateWishlistName, useI18n } from "../../lib/i18n";
import { BackButton } from "../back-button";
import { PlusIcon, TrashIcon } from "../icons";

const fieldClass =
  "w-full rounded-xl border border-line bg-white/70 px-3 py-2.5 text-[12px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15";

export function CitiesScreen({ onBack }: { onBack: () => void }) {
  const {
    activeWishlist,
    activeRequirements,
    addExcludedCity,
    removeExcludedCity,
  } = useAppData();
  const { t, locale } = useI18n();
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("United States");
  const [message, setMessage] = useState("");

  const wishlistName = activeWishlist
    ? translateWishlistName(activeWishlist.name, locale)
    : "";
  const excludedCities = activeWishlist?.excludedCities ?? [];
  const visibleRequirementCount = activeRequirements.length;

  function add() {
    if (!activeWishlist) return;
    if (!city.trim() || !region.trim()) {
      setMessage(t("cities.required"));
      return;
    }
    const result = addExcludedCity(activeWishlist.id, {
      city,
      region,
      country,
    });
    if (!result.ok) {
      setMessage(
        result.reason === "duplicate"
          ? t("cities.duplicate")
          : t("cities.invalid"),
      );
      return;
    }
    setCity("");
    setRegion("");
    setMessage(t("cities.added"));
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label={t("common.goBack")} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("cities.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[30px] leading-none tracking-[-0.02em] text-ink">
            {t("cities.title")}
          </h1>
        </div>
      </header>

      <div className="px-6 pb-10 pt-5">
        <div className="rounded-[22px] border border-line bg-white/55 px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
            {t("cities.activeWishlist")}
          </p>
          <p className="mt-1 text-[13px] font-medium text-ink">
            {wishlistName || "—"}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            {t("cities.wishlistScope", { count: visibleRequirementCount })}
          </p>
        </div>

        <section className="mt-4 rounded-[24px] border border-line bg-white/55 p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {t("cities.addTitle")}
          </p>
          <p className="mt-1 text-[10.5px] leading-4 text-muted">
            {t("cities.addHint")}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="col-span-2 block">
              <span className="text-[10px] text-muted">
                {t("cities.city")}
              </span>
              <input
                id="excluded-city"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setMessage("");
                }}
                placeholder={t("cities.cityPlaceholder")}
                className={`${fieldClass} mt-1.5`}
                autoComplete="address-level2"
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">
                {t("cities.region")}
              </span>
              <input
                id="excluded-region"
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  setMessage("");
                }}
                placeholder={t("cities.regionPlaceholder")}
                className={`${fieldClass} mt-1.5`}
                autoComplete="address-level1"
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">
                {t("cities.country")}
              </span>
              <input
                id="excluded-country"
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value);
                  setMessage("");
                }}
                placeholder={t("cities.countryPlaceholder")}
                className={`${fieldClass} mt-1.5`}
                autoComplete="country-name"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={add}
            className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-olive px-4 text-[11px] font-medium text-cream"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t("cities.add")}
          </button>

          {message && (
            <p
              role="status"
              className={[
                "mt-2 text-[10px] leading-4",
                message === t("cities.added") ? "text-olive" : "text-gold",
              ].join(" ")}
            >
              {message}
            </p>
          )}
        </section>

        <section className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-[21px] tracking-[-0.01em] text-ink">
              {t("cities.listTitle")}
            </h2>
            <span className="text-[9.5px] tabular-nums text-muted">
              {excludedCities.length}
            </span>
          </div>

          {excludedCities.length === 0 ? (
            <div className="mt-3 rounded-[22px] border border-line bg-parchment/60 px-4 py-4">
              <p className="text-[11.5px] font-medium text-ink">
                {t("cities.emptyTitle")}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted">
                {t("cities.emptyBody")}
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {excludedCities.map((excluded) => (
                <li
                  key={excluded.id}
                  className="flex items-center gap-3 rounded-2xl border border-line/80 bg-white/60 px-3.5 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-medium leading-4 text-ink">
                      {formatExcludedCity(excluded)}
                    </span>
                    <span className="mt-0.5 block text-[9px] uppercase tracking-[0.08em] text-clay">
                      {t("cities.dealbreaker")}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeWishlist) {
                        removeExcludedCity(activeWishlist.id, excluded.id);
                        setMessage("");
                      }
                    }}
                    aria-label={t("cities.removeAria", {
                      city: formatExcludedCity(excluded),
                    })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white/70 text-muted transition-colors hover:border-clay/30 hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/30"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-4 rounded-2xl bg-parchment px-4 py-3 text-[10px] leading-4 text-muted">
          {t("cities.note")}
        </p>
      </div>
    </div>
  );
}
