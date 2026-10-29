"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useAppData } from "../../lib/app-data";
import { isNearDuplicateAddress } from "../../lib/address-match";
import { formatLotLabel, formatLotSize, formatPrice } from "../../lib/homes";
import {
  translatePropertyType,
  useI18n,
  type TranslationKey,
} from "../../lib/i18n";
import { normalizeListingUrl, validateHomeDraft } from "../../lib/validation";
import { findState, US_STATES } from "../../lib/us-states";
import { BackButton } from "../back-button";
import { PhotoInput } from "../photo-input";
import {
  CheckIcon,
  ChevronDownIcon,
  MapPinIcon,
  SearchIcon,
} from "../icons";

type Suggestion = {
  id: string;
  label: string;
  secondary: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
};

type SearchResponse = {
  results?: Suggestion[];
  unavailable?: boolean;
};

type PropertyDetails = {
  address: string;
  city?: string;
  zip?: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  propertyType: string;
  lastSaleDate: string;
  lastSalePrice: number | null;
};

type LookupResponse = {
  found?: boolean;
  unavailable?: boolean;
  details?: PropertyDetails;
};

type LookupState = "idle" | "loading" | "found" | "empty" | "error";

const fieldClass =
  "w-full rounded-2xl border border-line bg-white/60 px-4 py-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15";

export function AddHomeScreen({
  onBack,
  onAdded,
}: {
  onBack: () => void;
  onAdded: (homeId: string) => void;
}) {
  const { homes, addHome, status } = useAppData();
  const { t, locale, number } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const addressId = useId();
  const stateId = useId();
  const cityId = useId();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [lot, setLot] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [garageCars, setGarageCars] = useState("");
  const [hoa, setHoa] = useState("");
  const [pool, setPool] = useState<"unknown" | "yes" | "no">("unknown");
  const [gated, setGated] = useState<"unknown" | "yes" | "no">("unknown");
  const [listingUrl, setListingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [confirmSuspicious, setConfirmSuspicious] = useState(false);

  const draftValidation = validateHomeDraft({
    price,
    beds,
    baths,
    sqft,
    hoa,
    garageCars,
    yearBuilt,
    lotAcres: "",
    listingUrl,
  });

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [saving, setSaving] = useState(false);

  const lookupController = useRef<AbortController | null>(null);
  const skipSuspiciousCheck = useRef(false);
  const autoFilled = useRef({ beds: "", baths: "", sqft: "" });
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [lookupDetails, setLookupDetails] = useState<PropertyDetails | null>(
    null,
  );

  const address = selected?.address ?? query.trim();
  const lookupAddress = [address, city.trim()].filter(Boolean).join(", ");
  const duplicate =
    address.length > 0 &&
    homes.some(
      (home) => home.address.trim().toLowerCase() === address.toLowerCase(),
    );
  const showList = open && !selected && query.trim().length >= 4;
  const selectedState = findState(stateCode);
  const nearDuplicate =
    address.length > 0 && !duplicate
      ? homes.find((home) => isNearDuplicateAddress(home.address, address))
      : undefined;
  const detailMeta = lookupDetails
    ? [
        translatePropertyType(lookupDetails.propertyType, locale),
        lookupDetails.yearBuilt
          ? t("add.built", { year: lookupDetails.yearBuilt })
          : "",
        lookupDetails.lastSalePrice
          ? lookupDetails.lastSaleDate
            ? t("add.lastSoldYear", {
                price: formatPrice(lookupDetails.lastSalePrice, locale),
                year: lookupDetails.lastSaleDate.slice(0, 4),
              })
            : t("add.lastSold", {
                price: formatPrice(lookupDetails.lastSalePrice, locale),
              })
          : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const updateDropDirection = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const spaceBelow = viewportTop + viewportHeight - rect.bottom;
    const spaceAbove = rect.top - viewportTop;
    setDropUp(spaceBelow < 240 && spaceAbove > spaceBelow);
  }, []);

  useEffect(() => {
    if (!showList) return;
    updateDropDirection();
  }, [showList, updateDropDirection]);

  useEffect(() => {
    const update = () => updateDropDirection();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
    };
  }, [updateDropDirection]);

  // Debounced address lookup. Each keystroke cancels the previous request.
  useEffect(() => {
    const trimmed = query.trim();
    if (selected || trimmed.length < 4) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setOpen(true);
      setLoading(true);
      setSearchFailed(false);

      const stateParam = stateCode
        ? `&state=${encodeURIComponent(stateCode)}`
        : "";

      fetch(
        `/api/address-search?q=${encodeURIComponent(trimmed)}${stateParam}`,
        {
          signal: controller.signal,
        },
      )
        .then(async (response) => {
          if (!response.ok) throw new Error(`Lookup failed ${response.status}`);
          return (await response.json()) as SearchResponse;
        })
        .then((payload) => {
          if (controller.signal.aborted) return;
          setSuggestions(payload.results ?? []);
          setSearchFailed(Boolean(payload.unavailable));
          if (inputRef.current === document.activeElement) setOpen(true);
          setActiveIndex(-1);
        })
        .catch((lookupError) => {
          if (controller.signal.aborted) return;
          console.warn("Address suggestions unavailable:", lookupError);
          setSuggestions([]);
          setSearchFailed(true);
          if (inputRef.current === document.activeElement) setOpen(true);
          setActiveIndex(-1);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, selected, stateCode]);

  useEffect(
    () => () => {
      lookupController.current?.abort();
    },
    [],
  );

  function clearAutoFilled() {
    const values = autoFilled.current;
    if (values.beds) {
      setBeds((value) => (value === values.beds ? "" : value));
    }
    if (values.baths) {
      setBaths((value) => (value === values.baths ? "" : value));
    }
    if (values.sqft) {
      setSqft((value) => (value === values.sqft ? "" : value));
    }
    autoFilled.current = { beds: "", baths: "", sqft: "" };
    setLot("");
    setYearBuilt("");
  }

  function applyDetails(details: PropertyDetails) {
    const values = autoFilled.current;
    const next = { ...values };

    if (details.bedrooms != null) {
      const value = String(details.bedrooms);
      setBeds((current) => (current && current !== values.beds ? current : value));
      next.beds = value;
    }

    if (details.bathrooms != null) {
      const value = String(details.bathrooms);
      setBaths((current) =>
        current && current !== values.baths ? current : value,
      );
      next.baths = value;
    }

    if (details.squareFootage != null) {
      const value = String(Math.round(details.squareFootage));
      setSqft((current) =>
        current && current !== values.sqft ? current : value,
      );
      next.sqft = value;
    }

    autoFilled.current = next;
    // Shared data is stored in English; display translates the unit.
    setLot(formatLotSize(details.lotSize ?? 0));
    setYearBuilt(details.yearBuilt ? String(details.yearBuilt) : "");

    // Keep county city/ZIP when the user did not type one, so the saved home
    // carries the full location from public records.
    if (!city.trim() && details.city) {
      const suffix = details.zip
        ? `${details.city}, FL ${details.zip}`
        : details.city;
      setCity(suffix);
    }
  }

  function resetLookup() {
    lookupController.current?.abort();
    lookupController.current = null;
    setLookupState("idle");
    setLookupDetails(null);
  }

  function lookupProperty(
    addressToLookUp: string,
    options?: { silent?: boolean },
  ) {
    const trimmed = addressToLookUp.trim();
    if (trimmed.length < 6) return;

    lookupController.current?.abort();
    const controller = new AbortController();
    lookupController.current = controller;
    setLookupState("loading");
    setLookupDetails(null);

    fetch(`/api/property-lookup?address=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Lookup failed ${response.status}`);
        return (await response.json()) as LookupResponse;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;

        if (!payload.found || !payload.details) {
          if (payload.unavailable) {
            setLookupState(options?.silent ? "idle" : "error");
          } else {
            setLookupState("empty");
          }
          return;
        }

        applyDetails(payload.details);
        setLookupDetails(payload.details);
        setLookupState("found");
      })
      .catch((lookupError) => {
        if (controller.signal.aborted) return;
        console.warn("Property details unavailable:", lookupError);
        setLookupState(options?.silent ? "idle" : "error");
      })
      .finally(() => {
        if (lookupController.current === controller) {
          lookupController.current = null;
        }
      });
  }

  function changeQuery(value: string) {
    setQuery(value);
    setSelected(null);
    setError(null);
    setSuggestions([]);
    setSearchFailed(false);
    setLoading(false);
    setActiveIndex(-1);
    setOpen(false);
    clearAutoFilled();
    resetLookup();
  }

  function changeState(value: string) {
    setStateCode(value);
    setSuggestions([]);
    setSearchFailed(false);
    setLoading(false);
    setActiveIndex(-1);
    setOpen(false);
    setError(null);
    inputRef.current?.focus();
  }

  function changeCity(value: string) {
    setCity(value);
    clearAutoFilled();
    resetLookup();
  }

  function choose(suggestion: Suggestion) {
    clearAutoFilled();
    setSelected(suggestion);
    setQuery(suggestion.address);
    setCity(suggestion.city);
    if (suggestion.stateCode) setStateCode(suggestion.stateCode);
    setSuggestions([]);
    setSearchFailed(false);
    setLoading(false);
    setOpen(false);
    setActiveIndex(-1);
    setError(null);
    inputRef.current?.focus();
    lookupProperty(
      [suggestion.address, suggestion.city].filter(Boolean).join(", "),
      { silent: true },
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (
      event.key === "Enter" &&
      showList &&
      activeIndex >= 0 &&
      suggestions[activeIndex]
    ) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!address) {
      setError("add.enterAddress");
      return;
    }

    if (duplicate) {
      setError("add.alreadySaved");
      return;
    }

    if (!draftValidation.valid) {
      setError(
        draftValidation.errors.price ? "add.invalidPrice" : "add.invalidNumber",
      );
      return;
    }

    if (
      draftValidation.suspiciousPrice &&
      !confirmSuspicious &&
      !skipSuspiciousCheck.current
    ) {
      setConfirmSuspicious(true);
      return;
    }

    setSaving(true);
    const values = draftValidation.values;
    const home = addHome({
      address,
      city: city.trim(),
      price: values.price ?? 0,
      beds: values.beds ?? 0,
      baths: values.baths ?? 0,
      sqft: values.sqft ?? 0,
      lot:
        values.lotAcres !== null
          ? formatLotSize(values.lotAcres * 43_560)
          : lot,
      garage:
        values.garageCars !== null
          ? `${values.garageCars} ${values.garageCars === 1 ? "car" : "cars"}`
          : "",
      hoa: values.hoa,
      pool: pool === "yes" ? true : pool === "no" ? false : null,
      gated: gated === "yes" ? true : gated === "no" ? false : null,
      yearBuilt: values.yearBuilt ?? 0,
      type: lookupDetails?.propertyType,
      listingUrl: normalizeListingUrl(values.listingUrl),
      notes: notes.trim(),
      photo,
      facts: {
        pool: pool === "yes" ? true : pool === "no" ? false : null,
        gated: gated === "yes" ? true : gated === "no" ? false : null,
        garageCars: values.garageCars,
        hoa: values.hoa,
        lotAcres: values.lotAcres,
      },
    });

    if (!home) {
      setSaving(false);
      setError("add.alreadySaved");
      return;
    }

    onAdded(home.id);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label={t("common.goBack")} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("add.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            {t("add.title")}
          </h1>
        </div>
      </header>

      <div className="px-6 pb-10 pt-5">
        <p className="text-[12px] leading-5 text-muted">{t("add.intro")}</p>

        <form id="add-home-form" onSubmit={submit} className="mt-5">
          <div>
            <label
              htmlFor={stateId}
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              {t("add.state")}{" "}
              <span className="normal-case text-muted">
                {t("add.optional")}
              </span>
            </label>

            <div className="relative mt-2">
              <select
                id={stateId}
                value={stateCode}
                onChange={(event) => changeState(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-line bg-white/60 py-3 pl-4 pr-10 text-[13px] text-ink outline-none transition-colors focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
              >
                <option value="">{t("add.anyState")}</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>

            <p className="mt-2 text-[10px] leading-4 text-muted">
              {selectedState
                ? t("add.stateSelected", { state: selectedState.name })
                : t("add.stateHint")}
            </p>
          </div>

          <label
            htmlFor={addressId}
            className="mt-5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
          >
            {t("add.streetAddress")}
          </label>

          <div className="relative mt-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                id={addressId}
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (query.trim().length >= 4 && !selected) setOpen(true);
                }}
                onBlur={() => {
                  // Let a click on a suggestion land before closing the list.
                  window.setTimeout(() => setOpen(false), 120);
                }}
                type="text"
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
                }
                aria-label={t("add.streetAddress")}
                autoComplete="off"
                autoFocus
                placeholder={t("add.streetPlaceholder")}
                className="w-full rounded-2xl border border-line bg-white/60 py-3.5 pl-11 pr-10 text-[14px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
              />
              {loading && (
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-line border-t-olive"
                />
              )}
            </div>

            {showList && (
              <ul
                id={listId}
                role="listbox"
                aria-label={t("add.suggestionsAria")}
                className={[
                  "absolute inset-x-0 z-30 max-h-64 overflow-y-auto rounded-2xl border border-line bg-cream py-1.5 shadow-[0_20px_45px_-20px_rgba(36,34,31,0.45)]",
                  dropUp ? "bottom-full mb-2" : "top-full mt-2",
                ].join(" ")}
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(suggestion)}
                    className={[
                      "flex cursor-pointer items-start gap-2.5 px-4 py-2.5 transition-colors",
                      index === activeIndex
                        ? "bg-parchment text-ink"
                        : "text-ink/85 hover:bg-parchment/70",
                    ].join(" ")}
                  >
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-olive/70" />
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium leading-5">
                        {suggestion.label}
                      </span>
                      {suggestion.secondary && (
                        <span className="mt-0.5 block truncate text-[10.5px] leading-4 text-muted">
                          {suggestion.secondary}
                        </span>
                      )}
                    </span>
                  </li>
                ))}

                {!loading && suggestions.length === 0 && (
                  <li className="px-4 py-3 text-[11px] leading-5 text-muted">
                    {searchFailed
                      ? t("add.searchUnavailable")
                      : t("add.noMatches")}
                  </li>
                )}

                {loading && suggestions.length === 0 && (
                  <li className="px-4 py-3 text-[11px] text-muted">
                    {t("add.searching")}
                  </li>
                )}
              </ul>
            )}
          </div>

          <p aria-live="polite" className="sr-only">
            {loading
              ? t("add.searchingAria")
              : suggestions.length > 0
                ? t("add.suggestionsAvailable", {
                    count: suggestions.length,
                  })
                : ""}
          </p>

          {selected && (
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-olive/20 bg-olive/[0.06] px-4 py-3">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-ink">
                  {selected.address}
                </p>
                {selected.secondary && (
                  <p className="mt-0.5 text-[10px] text-muted">
                    {selected.secondary}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  clearAutoFilled();
                  resetLookup();
                  setSelected(null);
                  setQuery("");
                  setCity("");
                  setSuggestions([]);
                  setSearchFailed(false);
                  setLoading(false);
                  setOpen(false);
                  inputRef.current?.focus();
                }}
                className="shrink-0 text-[10px] font-medium uppercase tracking-[0.1em] text-olive transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
              >
                {t("common.change")}
              </button>
            </div>
          )}

          {!selected && query.trim().length > 0 && query.trim().length < 4 && (
            <p className="mt-2 text-[10px] text-muted">
              {t("add.keepTyping")}
            </p>
          )}

          {duplicate && (
            <p className="mt-2 text-[11px] text-gold">{t("add.duplicate")}</p>
          )}

          {nearDuplicate && (
            <p className="mt-2 text-[11px] leading-4 text-gold">
              {t("add.nearDuplicate", { address: nearDuplicate.address })}
            </p>
          )}

          <div className="mt-6">
            <label
              htmlFor={cityId}
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              {t("add.city")}{" "}
              <span className="normal-case text-muted">
                {t("add.optional")}
              </span>
            </label>
            <input
              id={cityId}
              value={city}
              onChange={(event) => changeCity(event.target.value)}
              type="text"
              placeholder={t("add.cityPlaceholder")}
              className={`${fieldClass} mt-2`}
            />
          </div>

          <fieldset className="mt-6">
            <legend className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("add.details")}{" "}
              <span className="normal-case text-muted">
                {t("add.optional")}
              </span>
            </legend>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => lookupProperty(lookupAddress)}
                disabled={
                  lookupState === "loading" || lookupAddress.length < 6
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-olive/25 bg-olive/[0.06] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-olive transition-colors hover:bg-olive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {lookupState === "loading" ? (
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 animate-spin rounded-full border border-olive/30 border-t-olive"
                  />
                ) : (
                  <SearchIcon className="h-3 w-3" />
                )}
                {lookupState === "loading"
                  ? t("add.lookingUp")
                  : t("add.lookUp")}
              </button>

              {lookupState === "found" && (
                <span className="text-[10px] text-muted">
                  {t("add.recordsFound")}
                </span>
              )}
            </div>

            <p
              aria-live="polite"
              className="mt-1 text-[10px] leading-4 text-muted"
            >
              {lookupState === "idle" && t("add.hintIdle")}
              {lookupState === "loading" && t("add.hintLoading")}
              {lookupState === "found" && t("add.hintFound")}
              {lookupState === "empty" && t("add.hintEmpty")}
              {lookupState === "error" && t("add.hintError")}
            </p>

            {lookupState === "found" && lookupDetails && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-olive/20 bg-olive/[0.06]">
                <dl
                  aria-label={t("add.factsAria")}
                  className="grid grid-cols-4 divide-x divide-olive/15"
                >
                  {[
                    {
                      label: t("common.beds"),
                      value:
                        lookupDetails.bedrooms != null
                          ? number(lookupDetails.bedrooms)
                          : "—",
                    },
                    {
                      label: t("common.baths"),
                      value:
                        lookupDetails.bathrooms != null
                          ? number(lookupDetails.bathrooms)
                          : "—",
                    },
                    {
                      label: t("common.sqft"),
                      value:
                        lookupDetails.squareFootage != null
                          ? number(Math.round(lookupDetails.squareFootage))
                          : "—",
                    },
                    {
                      label: t("common.lot"),
                      value:
                        formatLotLabel(
                          formatLotSize(lookupDetails.lotSize ?? 0),
                          locale,
                        ) || "—",
                    },
                  ].map((fact) => (
                    <div key={fact.label} className="px-1 py-3 text-center">
                      <dd className="font-serif text-[17px] leading-none text-ink">
                        {fact.value}
                      </dd>
                      <dt className="mt-1.5 text-[8.5px] uppercase tracking-[0.1em] text-muted">
                        {fact.label}
                      </dt>
                    </div>
                  ))}
                </dl>

                <div className="border-t border-olive/15 px-4 py-2.5">
                  {detailMeta && (
                    <p className="text-[10px] leading-4 text-ink/80">
                      {detailMeta}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] leading-4 text-muted">
                    {t("add.recordsNote")}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] text-muted">{t("add.price")}</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="numeric"
                  placeholder="850000"
                  aria-label={t("add.price")}
                  className={`${fieldClass} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">
                  {t("add.squareFeet")}
                </span>
                <input
                  value={sqft}
                  onChange={(event) => setSqft(event.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="1800"
                  aria-label={t("add.squareFeet")}
                  className={`${fieldClass} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">{t("add.beds")}</span>
                <input
                  value={beds}
                  onChange={(event) => setBeds(event.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="3"
                  aria-label={t("common.bedrooms")}
                  className={`${fieldClass} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">{t("add.baths")}</span>
                <input
                  value={baths}
                  onChange={(event) => setBaths(event.target.value)}
                  type="number"
                  min={0}
                  step={0.5}
                  inputMode="decimal"
                  placeholder="2"
                  aria-label={t("common.bathrooms")}
                  className={`${fieldClass} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">{t("add.garage")}</span>
                <input
                  value={garageCars}
                  onChange={(event) => setGarageCars(event.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder={t("add.garagePlaceholder")}
                  aria-label={t("add.garage")}
                  className={`${fieldClass} mt-1.5`}
                />
                {draftValidation.errors.garageCars && (
                  <span className="mt-1 block text-[10px] text-gold">
                    {t("add.invalidNumber")}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">{t("add.hoa")}</span>
                <input
                  value={hoa}
                  onChange={(event) => setHoa(event.target.value)}
                  type="number"
                  min={0}
                  step={10}
                  inputMode="numeric"
                  placeholder="350"
                  aria-label={t("add.hoa")}
                  className={`${fieldClass} mt-1.5`}
                />
                {draftValidation.errors.hoa && (
                  <span className="mt-1 block text-[10px] text-gold">
                    {t("add.invalidNumber")}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">{t("add.pool")}</span>
                <select
                  value={pool}
                  onChange={(event) =>
                    setPool(event.target.value as "unknown" | "yes" | "no")
                  }
                  className={`${fieldClass} mt-1.5 appearance-none`}
                  aria-label={t("add.pool")}
                >
                  <option value="unknown">{t("common.notSure")}</option>
                  <option value="yes">{t("common.yes")}</option>
                  <option value="no">{t("common.no")}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">{t("add.gated")}</span>
                <select
                  value={gated}
                  onChange={(event) =>
                    setGated(event.target.value as "unknown" | "yes" | "no")
                  }
                  className={`${fieldClass} mt-1.5 appearance-none`}
                  aria-label={t("add.gated")}
                >
                  <option value="unknown">{t("common.notSure")}</option>
                  <option value="yes">{t("common.yes")}</option>
                  <option value="no">{t("common.no")}</option>
                </select>
              </label>
            </div>

            <div className="mt-3">
              <label className="block">
                <span className="text-[10px] text-muted">
                  {t("add.listingUrl")}{" "}
                  <span className="text-muted">{t("add.optional")}</span>
                </span>
                <input
                  value={listingUrl}
                  onChange={(event) => setListingUrl(event.target.value)}
                  inputMode="url"
                  placeholder="https://"
                  className={`${fieldClass} mt-1.5`}
                />
                {draftValidation.errors.listingUrl && (
                  <span className="mt-1 block text-[10px] text-gold">
                    {t("edit.invalidUrl")}
                  </span>
                )}
              </label>
            </div>

            <div className="mt-4">
              <PhotoInput value={photo} onChange={setPhoto} />
            </div>

            <div className="mt-3">
              <label className="block">
                <span className="text-[10px] text-muted">
                  {t("add.notes")}{" "}
                  <span className="text-muted">{t("add.optional")}</span>
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={2}
                  className={`${fieldClass} mt-1.5 resize-none leading-5`}
                />
              </label>
            </div>

            <p className="mt-2 text-[9.5px] leading-4 text-muted">
              {t("add.factsHint")}
            </p>
          </fieldset>

          {draftValidation.errors.price && (
            <p className="mt-2 text-[10px] text-gold">{t("add.invalidPrice")}</p>
          )}

          {confirmSuspicious && (
            <div
              role="alertdialog"
              className="mt-5 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3.5"
            >
              <p className="text-[12px] font-medium text-ink">
                {t("add.suspiciousTitle")}
              </p>
              <p className="mt-1 text-[10.5px] leading-4 text-muted">
                {t("validation.priceWarning")}
              </p>
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
                  onClick={() => {
                    skipSuspiciousCheck.current = true;
                    setConfirmSuspicious(false);
                    const form = document.getElementById(
                      "add-home-form",
                    ) as HTMLFormElement | null;
                    form?.requestSubmit();
                  }}
                  className="min-h-10 flex-1 rounded-full bg-olive text-[11px] font-medium text-cream"
                >
                  {t("edit.saveAnyway")}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 text-[11.5px] leading-5 text-ink/85"
            >
              {t(error)}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-olive py-3.5 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-60"
          >
            <CheckIcon className="h-4 w-4" />
            {saving ? t("add.adding") : t("add.addHome")}
          </button>

          <p className="mt-3 text-center text-[10px] leading-4 text-muted">
            {status === "synced"
              ? t("add.statusSynced")
              : status === "local"
                ? t("add.statusLocal")
                : t("add.statusConnecting")}
          </p>
        </form>
      </div>
    </div>
  );
}
