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
import { formatPrice } from "../../lib/homes";
import { findState, US_STATES } from "../../lib/us-states";
import { BackButton } from "../back-button";
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

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function AddHomeScreen({
  onBack,
  onAdded,
}: {
  onBack: () => void;
  onAdded: (homeId: string) => void;
}) {
  const { homes, addHome, status } = useAppData();
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

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lookupController = useRef<AbortController | null>(null);
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
  const detailMeta = lookupDetails
    ? [
        lookupDetails.propertyType,
        lookupDetails.yearBuilt ? `Built ${lookupDetails.yearBuilt}` : "",
        lookupDetails.lotSize
          ? `Lot ${Math.round(lookupDetails.lotSize).toLocaleString()} sq ft`
          : "",
        lookupDetails.lastSalePrice
          ? `Last sold ${formatPrice(lookupDetails.lastSalePrice)}${
              lookupDetails.lastSaleDate
                ? ` in ${lookupDetails.lastSaleDate.slice(0, 4)}`
                : ""
            }`
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
      setError("Enter a street address to continue.");
      return;
    }

    if (duplicate) {
      setError("That address is already in your shortlist.");
      return;
    }

    setSaving(true);
    const home = addHome({
      address,
      city: city.trim(),
      price: toNumber(price),
      beds: toNumber(beds),
      baths: toNumber(baths),
      sqft: toNumber(sqft),
    });

    if (!home) {
      setSaving(false);
      setError("That address is already in your shortlist.");
      return;
    }

    onAdded(home.id);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label="Go back" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            New shortlist
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            Add a Home
          </h1>
        </div>
      </header>

      <div className="px-6 pb-10 pt-5">
        <p className="text-[12px] leading-5 text-muted">
          Pick a state to make suggestions more accurate, then start typing a
          street address and choose the closest match. You can add the details
          you know and fill in the rest later.
        </p>

        <form onSubmit={submit} className="mt-5">
          <div>
            <label
              htmlFor={stateId}
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              State <span className="normal-case text-muted/70">(optional)</span>
            </label>

            <div className="relative mt-2">
              <select
                id={stateId}
                value={stateCode}
                onChange={(event) => changeState(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-line bg-white/60 py-3 pl-4 pr-10 text-[13px] text-ink outline-none transition-colors focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
              >
                <option value="">Any state</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
            </div>

            <p className="mt-2 text-[10px] leading-4 text-muted">
              {selectedState
                ? `Address suggestions will be narrowed to ${selectedState.name}.`
                : "Choosing a state first narrows the address suggestions to that state."}
            </p>
          </div>

          <label
            htmlFor={addressId}
            className="mt-5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
          >
            Street address
          </label>

          <div className="relative mt-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted/60" />
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
                aria-label="Street address"
                autoComplete="off"
                autoFocus
                placeholder="e.g. 123 Palm Lane"
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
                aria-label="Address suggestions"
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
                      ? "Address suggestions are unavailable right now. You can still add the address you typed."
                      : "No matches found. You can still add the address you typed."}
                  </li>
                )}

                {loading && suggestions.length === 0 && (
                  <li className="px-4 py-3 text-[11px] text-muted">
                    Searching addresses…
                  </li>
                )}
              </ul>
            )}
          </div>

          <p aria-live="polite" className="sr-only">
            {loading
              ? "Searching for address suggestions."
              : suggestions.length > 0
                ? `${suggestions.length} address suggestions available.`
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
                Change
              </button>
            </div>
          )}

          {!selected && query.trim().length > 0 && query.trim().length < 4 && (
            <p className="mt-2 text-[10px] text-muted">
              Keep typing to see address suggestions.
            </p>
          )}

          {duplicate && (
            <p className="mt-2 text-[11px] text-gold">
              This address is already in your shortlist.
            </p>
          )}

          <div className="mt-6">
            <label
              htmlFor={cityId}
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              City / area <span className="normal-case text-muted/70">(optional)</span>
            </label>
            <input
              id={cityId}
              value={city}
              onChange={(event) => changeCity(event.target.value)}
              type="text"
              placeholder="e.g. Miami, FL 33137"
              className={`${fieldClass} mt-2`}
            />
          </div>

          <fieldset className="mt-6">
            <legend className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              Details <span className="normal-case text-muted/70">(optional)</span>
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
                {lookupState === "loading" ? "Looking up…" : "Look up details"}
              </button>

              {lookupState === "found" && (
                <span className="text-[10px] text-muted">
                  Public records found
                </span>
              )}
            </div>

            <p
              aria-live="polite"
              className="mt-1 text-[10px] leading-4 text-muted"
            >
              {lookupState === "idle" &&
                "Fill in what you know, or look up beds, baths and square footage from public records."}
              {lookupState === "loading" &&
                "Searching public records for this address…"}
              {lookupState === "found" &&
                "Beds, baths and square footage were prefilled where available. Double-check before saving."}
              {lookupState === "empty" &&
                "No public records found for this address. You can still fill in the details manually."}
              {lookupState === "error" &&
                "Property details aren't available right now. Fill them in manually or try again."}
            </p>

            {lookupState === "found" && lookupDetails && detailMeta && (
              <div className="mt-3 rounded-2xl border border-olive/20 bg-olive/[0.06] px-4 py-3">
                <p className="text-[10.5px] leading-4 text-ink/80">
                  {detailMeta}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-muted">
                  Last sale price is not the current asking price.
                </p>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] text-muted">Price</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="numeric"
                  placeholder="850000"
                  aria-label="Price"
                  className={`${fieldClass} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">Square feet</span>
                <input
                  value={sqft}
                  onChange={(event) => setSqft(event.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="1800"
                  aria-label="Square feet"
                  className={`${fieldClass} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">Beds</span>
                <input
                  value={beds}
                  onChange={(event) => setBeds(event.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="3"
                  aria-label="Bedrooms"
                  className={`${fieldClass} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-muted">Baths</span>
                <input
                  value={baths}
                  onChange={(event) => setBaths(event.target.value)}
                  type="number"
                  min={0}
                  step={0.5}
                  inputMode="decimal"
                  placeholder="2"
                  aria-label="Bathrooms"
                  className={`${fieldClass} mt-1.5`}
                />
              </label>
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 text-[11.5px] leading-5 text-ink/85"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-olive py-3.5 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-60"
          >
            <CheckIcon className="h-4 w-4" />
            {saving ? "Adding home…" : "Add Home"}
          </button>

          <p className="mt-3 text-center text-[10px] leading-4 text-muted">
            {status === "synced"
              ? "Saved to your shared shortlist."
              : status === "local"
                ? "Saved on this device until your shared list reconnects."
                : "Connecting to your shortlist…"}
          </p>
        </form>
      </div>
    </div>
  );
}
