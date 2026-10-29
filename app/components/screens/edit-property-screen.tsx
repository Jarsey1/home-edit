"use client";

import { useMemo, useState } from "react";
import { useAppData } from "../../lib/app-data";
import { formatLotSize, type Home } from "../../lib/homes";
import {
  translateRequirementName,
  translateWishlistText,
  useI18n,
} from "../../lib/i18n";
import { customFeatureKeys, parseLotAcres } from "../../lib/property-facts";
import { validateHomeDraft } from "../../lib/validation";
import {
  FEATURE_BY_KEY,
  type FactValue,
  type PropertyFacts,
  type TourStatus,
} from "../../lib/v2-types";
import { BackButton } from "../back-button";
import { PhotoInput } from "../photo-input";
import { CheckIcon } from "../icons";

const fieldClass =
  "w-full rounded-2xl border border-line bg-white/60 px-4 py-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15";

const OPTIONAL_FACT_KEYS = [
  "floodZone",
  "walkScore",
  "schoolRating",
  "commuteMinutes",
] as const;

const CORE_FACT_KEYS = new Set([
  "price",
  "beds",
  "baths",
  "sqft",
  "hoa",
  "garageCars",
  "lotAcres",
  "yearBuilt",
  "city",
  "excludedCity",
  "monthlyOwnershipCost",
  "propertyType",
  "pool",
  "gated",
]);

export function EditPropertyScreen({
  home,
  onBack,
}: {
  home: Home;
  onBack: () => void;
}) {
  const { updateHome, activeRequirements } = useAppData();
  const { t, locale } = useI18n();

  const [address, setAddress] = useState(home.address);
  const [city, setCity] = useState(home.city);
  const [price, setPrice] = useState(home.price > 0 ? String(home.price) : "");
  const [beds, setBeds] = useState(home.beds > 0 ? String(home.beds) : "");
  const [baths, setBaths] = useState(home.baths > 0 ? String(home.baths) : "");
  const [sqft, setSqft] = useState(home.sqft > 0 ? String(home.sqft) : "");
  const [lotAcres, setLotAcres] = useState(() => {
    const acres = parseLotAcres(home.lot);
    return acres === null ? "" : String(acres);
  });
  const [garageCars, setGarageCars] = useState(
    home.garage.replace(/[^0-9.]/g, "") || "",
  );
  const [hoa, setHoa] = useState(home.hoa > 0 ? String(home.hoa) : "");
  const [yearBuilt, setYearBuilt] = useState(
    home.yearBuilt > 0 ? String(home.yearBuilt) : "",
  );
  const [type, setType] = useState(home.type || "Single family");
  const [description, setDescription] = useState(home.description);
  const [listingUrl, setListingUrl] = useState(home.listingUrl ?? "");
  const [photo, setPhoto] = useState<string | null>(home.photo ?? null);
  const [notes, setNotes] = useState(home.notes ?? "");
  const [tourDate, setTourDate] = useState(home.tourDate ?? "");
  const [tourStatus, setTourStatus] = useState<TourStatus>(
    home.tourStatus ?? "none",
  );
  const [facts, setFacts] = useState<PropertyFacts>(() => {
    const initial = { ...(home.facts ?? {}) };
    if (!Object.prototype.hasOwnProperty.call(initial, "pool")) {
      initial.pool = home.pool;
    }
    if (!Object.prototype.hasOwnProperty.call(initial, "gated")) {
      initial.gated = home.gated;
    }
    return initial;
  });
  const [saved, setSaved] = useState(false);
  const [confirmSuspicious, setConfirmSuspicious] = useState(false);

  const draft = {
    price,
    beds,
    baths,
    sqft,
    hoa,
    garageCars,
    yearBuilt,
    lotAcres,
    listingUrl,
  };
  const validation = validateHomeDraft(draft);
  const errors = validation.errors;

  const featureInputs = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; kind: "number" | "boolean" | "text" }
    >();
    for (const requirement of activeRequirements) {
      if (CORE_FACT_KEYS.has(requirement.featureKey)) continue;
      const feature = FEATURE_BY_KEY[requirement.featureKey];
      map.set(requirement.featureKey, {
        key: requirement.featureKey,
        label: requirement.name,
        kind:
          feature?.kind ??
          (requirement.type === "yes"
            ? "boolean"
            : requirement.type === "text" || requirement.type === "exclude"
              ? "text"
              : "number"),
      });
    }
    for (const custom of customFeatureKeys(activeRequirements)) {
      if (!map.has(custom.key)) {
        map.set(custom.key, { key: custom.key, label: custom.label, kind: "text" });
      }
    }
    for (const key of OPTIONAL_FACT_KEYS) {
      if (map.has(key)) continue;
      const feature = FEATURE_BY_KEY[key];
      if (feature) {
        map.set(key, {
          key,
          label: feature.label,
          kind: feature.kind,
        });
      }
    }
    return [...map.values()];
  }, [activeRequirements]);

  function factValue(key: string): FactValue {
    const value = facts[key];
    return value === undefined ? null : value;
  }

  function setFact(key: string, value: FactValue) {
    setFacts((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function save(confirm = false) {
    if (!address.trim()) return;
    if (!validation.valid) return;
    if (validation.suspiciousPrice && !confirm) {
      setConfirmSuspicious(true);
      return;
    }

    const pool = facts.pool;
    const gated = facts.gated;
    const lot =
      validation.values.lotAcres !== null
        ? formatLotSize(validation.values.lotAcres * 43_560)
        : "";

    updateHome(home.id, {
      address: address.trim(),
      city: city.trim(),
      price: validation.values.price ?? 0,
      beds: validation.values.beds ?? 0,
      baths: validation.values.baths ?? 0,
      sqft: validation.values.sqft ?? 0,
      lot,
      garage:
        validation.values.garageCars !== null
          ? `${validation.values.garageCars} ${validation.values.garageCars === 1 ? "car" : "cars"}`
          : "",
      hoa: validation.values.hoa ?? 0,
      yearBuilt: validation.values.yearBuilt ?? 0,
      type: type.trim() || "Single family",
      description: description.trim(),
      pool: pool === true,
      gated: gated === true,
      listingUrl: validation.values.listingUrl,
      photo,
      notes: notes.trim(),
      facts: {
        ...facts,
        pool: pool === true ? true : pool === false ? false : null,
        gated: gated === true ? true : gated === false ? false : null,
        garageCars: validation.values.garageCars,
        hoa: validation.values.hoa,
        lotAcres: validation.values.lotAcres,
      },
      tourDate: tourDate || null,
      tourStatus: tourDate
        ? tourStatus === "none"
          ? "scheduled"
          : tourStatus
        : "none",
    });
    setSaved(true);
    setConfirmSuspicious(false);
    window.setTimeout(onBack, 350);
  }

  function errorText(key: keyof typeof errors) {
    if (!errors[key]) return "";
    return errors[key] === "negative"
      ? t("edit.negative")
      : errors[key] === "url"
        ? t("edit.invalidUrl")
        : t("edit.invalid");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label={t("common.goBack")} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("edit.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            {t("edit.title")}
          </h1>
        </div>
      </header>

      <div className="px-6 pb-10 pt-4">
        <p className="text-[12px] leading-5 text-muted">{t("edit.intro")}</p>

        <div className="mt-4 rounded-[24px] border border-line bg-white/50 p-4">
          <PhotoInput value={photo} onChange={setPhoto} />
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-address" className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("edit.address")}
            </label>
            <input
              id="edit-address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setSaved(false);
              }}
              className={`${fieldClass} mt-2`}
              autoComplete="street-address"
            />
            {!address.trim() && (
              <p className="mt-1 text-[10px] text-gold">{t("edit.addressRequired")}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-city" className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("edit.city")}
            </label>
            <input
              id="edit-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={`${fieldClass} mt-2`}
            />
          </div>

          <label className="block">
            <span className="text-[10px] text-muted">{t("edit.price")}</span>
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              type="number"
              min={0}
              step="1000"
              inputMode="numeric"
              className={`${fieldClass} mt-1.5`}
              aria-label={t("edit.price")}
            />
            {errorText("price") && (
              <span className="mt-1 block text-[10px] text-gold">
                {errorText("price")}
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.beds")}</span>
              <input
                value={beds}
                onChange={(event) => setBeds(event.target.value)}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className={`${fieldClass} mt-1.5`}
              />
              {errorText("beds") && (
                <span className="mt-1 block text-[10px] text-gold">{errorText("beds")}</span>
              )}
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.baths")}</span>
              <input
                value={baths}
                onChange={(event) => setBaths(event.target.value)}
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                className={`${fieldClass} mt-1.5`}
              />
              {errorText("baths") && (
                <span className="mt-1 block text-[10px] text-gold">{errorText("baths")}</span>
              )}
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.sqft")}</span>
              <input
                value={sqft}
                onChange={(event) => setSqft(event.target.value)}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className={`${fieldClass} mt-1.5`}
              />
              {errorText("sqft") && (
                <span className="mt-1 block text-[10px] text-gold">{errorText("sqft")}</span>
              )}
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.lotAcres")}</span>
              <input
                value={lotAcres}
                onChange={(event) => setLotAcres(event.target.value)}
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                className={`${fieldClass} mt-1.5`}
              />
              {errorText("lotAcres") && (
                <span className="mt-1 block text-[10px] text-gold">{errorText("lotAcres")}</span>
              )}
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.garage")}</span>
              <input
                value={garageCars}
                onChange={(event) => setGarageCars(event.target.value)}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className={`${fieldClass} mt-1.5`}
              />
              {errorText("garageCars") && (
                <span className="mt-1 block text-[10px] text-gold">{errorText("garageCars")}</span>
              )}
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.hoa")}</span>
              <input
                value={hoa}
                onChange={(event) => setHoa(event.target.value)}
                type="number"
                min={0}
                step={10}
                inputMode="numeric"
                className={`${fieldClass} mt-1.5`}
              />
              {errorText("hoa") && (
                <span className="mt-1 block text-[10px] text-gold">{errorText("hoa")}</span>
              )}
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.yearBuilt")}</span>
              <input
                value={yearBuilt}
                onChange={(event) => setYearBuilt(event.target.value)}
                type="number"
                min={1800}
                step={1}
                inputMode="numeric"
                className={`${fieldClass} mt-1.5`}
              />
              {errorText("yearBuilt") && (
                <span className="mt-1 block text-[10px] text-gold">{errorText("yearBuilt")}</span>
              )}
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.propertyType")}</span>
              <input
                value={type}
                onChange={(event) => setType(event.target.value)}
                className={`${fieldClass} mt-1.5`}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.pool")}</span>
              <select
                value={factValue("pool") === true ? "yes" : factValue("pool") === false ? "no" : "unknown"}
                onChange={(event) =>
                  setFact(
                    "pool",
                    event.target.value === "yes"
                      ? true
                      : event.target.value === "no"
                        ? false
                        : null,
                  )
                }
                className={`${fieldClass} mt-1.5 appearance-none`}
              >
                <option value="unknown">{t("common.notSure")}</option>
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] text-muted">{t("edit.gated")}</span>
              <select
                value={factValue("gated") === true ? "yes" : factValue("gated") === false ? "no" : "unknown"}
                onChange={(event) =>
                  setFact(
                    "gated",
                    event.target.value === "yes"
                      ? true
                      : event.target.value === "no"
                        ? false
                        : null,
                  )
                }
                className={`${fieldClass} mt-1.5 appearance-none`}
              >
                <option value="unknown">{t("common.notSure")}</option>
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
              </select>
            </label>
          </div>

          <div>
            <label htmlFor="edit-description" className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("edit.description")}
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className={`${fieldClass} mt-2 resize-none leading-5`}
            />
          </div>

          <div>
            <label htmlFor="edit-listing" className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("edit.listingUrl")}
            </label>
            <input
              id="edit-listing"
              value={listingUrl}
              onChange={(event) => setListingUrl(event.target.value)}
              inputMode="url"
              placeholder="https://"
              className={`${fieldClass} mt-2`}
            />
            {errorText("listingUrl") && (
              <p className="mt-1 text-[10px] text-gold">{errorText("listingUrl")}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-notes" className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("edit.notes")}
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder={t("edit.notesPlaceholder")}
              className={`${fieldClass} mt-2 resize-none leading-5`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-tour-date" className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("edit.tourDate")}
              </label>
              <input
                id="edit-tour-date"
                type="date"
                value={tourDate ?? ""}
                onChange={(event) => setTourDate(event.target.value)}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="edit-tour-status" className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("property.tourStatus")}
              </label>
              <select
                id="edit-tour-status"
                value={tourStatus}
                onChange={(event) =>
                  setTourStatus(event.target.value as TourStatus)
                }
                className={`${fieldClass} mt-2 appearance-none`}
              >
                <option value="none">{t("edit.tourNone")}</option>
                <option value="scheduled">{t("edit.tourScheduled")}</option>
                <option value="toured">{t("edit.tourToured")}</option>
                <option value="cancelled">{t("edit.tourCancelled")}</option>
              </select>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-[22px] border border-line bg-parchment/60 p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {t("edit.facts")}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            {t("edit.factsHint")}
          </p>

          {featureInputs.length === 0 ? (
            <p className="mt-3 text-[11px] text-muted">{t("edit.unknownHint")}</p>
          ) : (
            <div className="mt-3 space-y-3">
              {featureInputs.map((feature) => {
                const value = factValue(feature.key);
                return (
                  <div key={feature.key}>
                    <p className="text-[10px] text-muted">
                      {translateWishlistText(
                        translateRequirementName(feature.label, locale),
                        locale,
                      )}{" "}
                    </p>
                    {feature.kind === "boolean" ? (
                      <select
                        value={value === true ? "yes" : value === false ? "no" : "unknown"}
                        onChange={(event) =>
                          setFact(
                            feature.key,
                            event.target.value === "yes"
                              ? true
                              : event.target.value === "no"
                                ? false
                                : null,
                          )
                        }
                        className={`${fieldClass} mt-1.5 appearance-none`}
                        aria-label={feature.label}
                      >
                        <option value="unknown">{t("common.notSure")}</option>
                        <option value="yes">{t("common.yes")}</option>
                        <option value="no">{t("common.no")}</option>
                      </select>
                    ) : feature.kind === "number" ? (
                      <input
                        value={typeof value === "number" ? String(value) : value === null || value === undefined ? "" : String(value)}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (!raw.trim()) {
                            setFact(feature.key, null);
                            return;
                          }
                          const parsed = Number(raw);
                          setFact(feature.key, Number.isFinite(parsed) ? parsed : null);
                        }}
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        className={`${fieldClass} mt-1.5`}
                        aria-label={feature.label}
                      />
                    ) : (
                      <input
                        value={value === null || value === undefined ? "" : String(value)}
                        onChange={(event) =>
                          setFact(feature.key, event.target.value || null)
                        }
                        className={`${fieldClass} mt-1.5`}
                        aria-label={feature.label}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-[9.5px] leading-4 text-muted">
            {t("edit.unknownHint")}
          </p>
        </section>

        {confirmSuspicious && (
          <div role="alertdialog" className="mt-5 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3.5">
            <p className="text-[12px] font-medium text-ink">{t("edit.suspiciousTitle")}</p>
            <p className="mt-1 text-[10.5px] leading-4 text-muted">{t("validation.priceWarning")}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSuspicious(false)}
                className="min-h-10 flex-1 rounded-full border border-line bg-white/70 text-[11px] font-medium text-ink"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => save(true)}
                className="min-h-10 flex-1 rounded-full bg-olive text-[11px] font-medium text-cream"
              >
                {t("edit.saveAnyway")}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => save(false)}
          disabled={!address.trim() || !validation.valid}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-olive py-3.5 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saved ? t("edit.saved") : t("edit.save")}
        </button>
        {!validation.valid && (
          <p className="mt-2 text-center text-[10px] text-gold">{t("edit.saveError")}</p>
        )}
      </div>
    </div>
  );
}
