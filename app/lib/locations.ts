import type { ExcludedCity } from "./v2-types";

const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar",
  california: "ca", colorado: "co", connecticut: "ct", delaware: "de",
  florida: "fl", georgia: "ga", hawaii: "hi", idaho: "id",
  illinois: "il", indiana: "in", iowa: "ia", kansas: "ks",
  kentucky: "ky", louisiana: "la", maine: "me", maryland: "md",
  massachusetts: "ma", michigan: "mi", minnesota: "mn",
  mississippi: "ms", missouri: "mo", montana: "mt", nebraska: "ne",
  nevada: "nv", "new hampshire": "nh", "new jersey": "nj",
  "new mexico": "nm", "new york": "ny", "north carolina": "nc",
  "north dakota": "nd", ohio: "oh", oklahoma: "ok", oregon: "or",
  pennsylvania: "pa", "rhode island": "ri", "south carolina": "sc",
  "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut",
  vermont: "vt", virginia: "va", washington: "wa",
  "west virginia": "wv", wisconsin: "wi", wyoming: "wy",
  "district of columbia": "dc", "puerto rico": "pr",
};

const COUNTRY_ALIASES: Record<string, string> = {
  us: "us", usa: "us", "united states": "us", "united states of america": "us",
  ca: "ca", canada: "ca",
  mx: "mx", mexico: "mx",
};

export function normalizeLocationPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeRegion(value: string) {
  const cleaned = value
    // Strip ZIP and placeholder codes such as "33137" or "331XX".
    .replace(/\b\d[0-9A-Za-z-]*\b/g, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .trim();
  const normalized = normalizeLocationPart(cleaned);
  if (!normalized) return "";
  if (normalized.length === 2) return normalized;
  return STATE_ABBREVIATIONS[normalized] ?? normalized;
}

export function normalizeCountry(value: string) {
  const normalized = normalizeLocationPart(value);
  return COUNTRY_ALIASES[normalized] ?? (normalized || "us");
}

export function locationKey(city: string, region: string, country: string) {
  const normalizedCity = normalizeLocationPart(city);
  const normalizedRegion = normalizeRegion(region);
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCity || !normalizedRegion) return null;
  return `${normalizedCity}|${normalizedRegion}|${normalizedCountry}`;
}

export type ParsedLocation = {
  city: string;
  region: string;
  country: string;
  key: string | null;
  verified: boolean;
};

/**
 * Parse a saved home city such as "Davie, Florida" or "Miami, FL 33137".
 * A city without a state/region is deliberately not verified: we must not
 * disqualify a property when its location is ambiguous.
 */
export function parsePropertyLocation(value: string): ParsedLocation {
  const [cityPart, ...rest] = value.split(",");
  const city = (cityPart ?? "").trim();
  const regionPart = rest.join(",").trim();
  const region = normalizeRegion(regionPart);
  const country = "United States";
  const key = locationKey(city, region, country);
  return {
    city,
    region,
    country,
    key,
    verified: Boolean(city && region && key),
  };
}

export function excludedCityKey(
  city: string,
  region: string,
  country: string,
) {
  return locationKey(city, region, country);
}

export function formatExcludedCity(city: ExcludedCity) {
  const region =
    city.region.length === 2 ? city.region.toUpperCase() : city.region;
  return [city.city, region, city.country].filter(Boolean).join(", ");
}
