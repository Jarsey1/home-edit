import type { Locale } from "./locale";
import type { PropertyFacts, TourStatus } from "./v2-types";

export type Home = {
  id: string;
  address: string;
  city: string;
  price: number;
  match: number;
  beds: number;
  baths: number;
  sqft: number;
  lot: string;
  garage: string;
  pool: boolean;
  gated: boolean;
  hoa: number;
  yearBuilt: number;
  type: string;
  daysOnMarket: number;
  imageFilter: string;
  description: string;
  features: string[];
  saved: boolean;
  tourRequested: boolean;
  /** V2 details, merged from the separate property_details record. */
  photo?: string | null;
  listingUrl?: string;
  notes?: string;
  favorite?: boolean;
  facts?: PropertyFacts;
  tourDate?: string | null;
  tourStatus?: TourStatus;
};

export const HOMES: Home[] = [
  {
    id: "palm-lane",
    address: "123 Palm Lane",
    city: "Miami, FL 331XX",
    price: 1_250_000,
    match: 92,
    beds: 5,
    baths: 4,
    sqft: 3_200,
    lot: "0.25 ac",
    garage: "2 cars",
    pool: true,
    gated: true,
    hoa: 350,
    yearBuilt: 2018,
    type: "Single family",
    daysOnMarket: 6,
    imageFilter: "none",
    description:
      "A beautiful family home in a gated community with a pool, modern kitchen and a spacious backyard. Natural light fills the open living spaces, and the covered patio is made for slow weekends.",
    features: ["Pool", "Gated community", "Covered patio", "Updated kitchen"],
    saved: true,
    tourRequested: true,
  },
  {
    id: "oak-drive",
    address: "456 Oak Drive",
    city: "Miami, FL 331XX",
    price: 1_100_000,
    match: 78,
    beds: 5,
    baths: 3,
    sqft: 2_850,
    lot: "0.20 ac",
    garage: "2 cars",
    pool: false,
    gated: true,
    hoa: 200,
    yearBuilt: 2014,
    type: "Single family",
    daysOnMarket: 12,
    imageFilter: "hue-rotate(-14deg) saturate(0.82) brightness(1.03)",
    description:
      "A bright, open-plan home with a renovated kitchen, a private garden and a covered terrace. The layout keeps the living spaces connected while the bedrooms stay quiet and tucked away.",
    features: ["Renovated kitchen", "Private garden", "Covered terrace"],
    saved: true,
    tourRequested: false,
  },
  {
    id: "lakeview",
    address: "789 Lakeview",
    city: "Coral Gables, FL 331XX",
    price: 1_375_000,
    match: 71,
    beds: 6,
    baths: 4,
    sqft: 3_600,
    lot: "0.30 ac",
    garage: "3 cars",
    pool: true,
    gated: false,
    hoa: 450,
    yearBuilt: 2020,
    type: "Single family",
    daysOnMarket: 21,
    imageFilter: "sepia(0.16) hue-rotate(14deg) saturate(1.08)",
    description:
      "A generous lakeview home with room to grow, a resort-style pool and wide entertaining spaces. Large windows frame the water, and the primary suite opens directly onto the garden.",
    features: ["Lake view", "Resort-style pool", "Primary suite", "3-car garage"],
    saved: true,
    tourRequested: false,
  },
];

export const TOP_MATCH = HOMES[0];

/**
 * Map camelCase Home fields to the snake_case columns used by Supabase.
 * Home updates must use this map or PostgREST rejects the whole patch.
 */
export function homePatchToRow(
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const columns: Record<string, string> = {
    yearBuilt: "year_built",
    tourRequested: "tour_requested",
    daysOnMarket: "days_on_market",
    imageFilter: "image_filter",
  };
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      columns[key] ?? key,
      value,
    ]),
  );
}

export function getHome(id: string) {
  return HOMES.find((home) => home.id === id) ?? TOP_MATCH;
}

function localeCode(locale: Locale) {
  return locale === "es" ? "es-US" : "en-US";
}

export function formatPrice(value: number, locale: Locale = "en") {
  return new Intl.NumberFormat(localeCode(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** New homes can be added before a price is known. */
export function formatPriceOrPending(value: number, locale: Locale = "en") {
  if (value > 0) return formatPrice(value, locale);
  return locale === "es" ? "Precio por confirmar" : "Price TBD";
}

/** Public records give lot size in square feet; show acres for normal lots. */
export function formatLotSize(squareFeet: number, locale: Locale = "en") {
  if (!Number.isFinite(squareFeet) || squareFeet <= 0) return "";
  const acres = squareFeet / 43_560;
  if (acres < 0.25) {
    const amount = Math.round(squareFeet).toLocaleString(localeCode(locale));
    return `${amount} ${locale === "es" ? "pies²" : "sq ft"}`;
  }
  const amount = acres.toFixed(acres >= 1 ? 1 : 2);
  return `${amount} ${locale === "es" ? "acres" : "ac"}`;
}

/**
 * Lot sizes saved before the language switch are stored in English. Show the
 * unit in the current language without rewriting the shared record.
 */
export function formatLotLabel(value: string, locale: Locale = "en") {
  if (!value || locale !== "es") return value;
  return value
    .replace(/\bsq ft\b/gi, "pies²")
    .replace(/\bac\b/gi, "acres");
}

/** Garage capacity is stored in English; translate the unit for display. */
export function formatGarageLabel(value: string, locale: Locale = "en") {
  if (!value || locale !== "es") return value;
  return value.replace(/\bcar\b/gi, "auto").replace(/\bcars\b/gi, "autos");
}

export function formatPriceShort(value: number, locale: Locale = "en") {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${
      Number.isInteger(millions)
        ? millions.toLocaleString(localeCode(locale))
        : millions.toFixed(2)
    }M`;
  }
  return `$${Math.round(value / 1_000).toLocaleString(
    localeCode(locale),
  )}K`;
}
