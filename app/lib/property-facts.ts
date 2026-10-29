import type { Home } from "./homes";
import {
  FEATURE_BY_KEY,
  type FactValue,
  type PropertyFacts,
  type WishlistRequirement,
} from "./v2-types";

function has(facts: PropertyFacts, key: string) {
  return Object.prototype.hasOwnProperty.call(facts, key);
}

export function cityName(value: string): string | null {
  const city = value.split(",")[0]?.trim();
  return city ? city : null;
}

export function parseLotAcres(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (!value) return null;
  const text = value.trim().toLowerCase().replace(/,/g, "");

  const acreMatch = text.match(/([\d.]+)\s*(ac|acre|acres)\b/);
  if (acreMatch) {
    const acres = Number(acreMatch[1]);
    return Number.isFinite(acres) && acres > 0 ? acres : null;
  }

  const sqftMatch = text.match(/([\d.]+)\s*(sq\s*ft|sqft|pies)/);
  if (sqftMatch) {
    const sqft = Number(sqftMatch[1]);
    return Number.isFinite(sqft) && sqft > 0 ? sqft / 43_560 : null;
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 0) {
    // A bare number is most likely square feet for a residential lot.
    return numeric > 20 ? numeric / 43_560 : numeric;
  }
  return null;
}

export function parseGarageCars(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const cars = Number(match[1]);
  return Number.isFinite(cars) && cars > 0 ? cars : null;
}

export function knownNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

/**
 * Turn the stored home record plus its V2 details into the independent fact
 * map used by the scoring engine. Unknown values stay null.
 */
export function factsFromHome(
  home: Home,
  options: { monthlyOwnershipCost?: number | null } = {},
): PropertyFacts {
  const details = home.facts ?? {};
  const facts: PropertyFacts = { ...details };

  if (!has(facts, "price")) facts.price = knownNumber(home.price);
  if (!has(facts, "beds")) facts.beds = knownNumber(home.beds);
  if (!has(facts, "baths")) facts.baths = knownNumber(home.baths);
  if (!has(facts, "sqft")) facts.sqft = knownNumber(home.sqft);
  if (!has(facts, "yearBuilt")) facts.yearBuilt = knownNumber(home.yearBuilt);
  if (!has(facts, "city")) facts.city = cityName(home.city);
  if (!has(facts, "excludedCity")) facts.excludedCity = cityName(home.city);
  if (!has(facts, "propertyType")) facts.propertyType = home.type || null;
  if (!has(facts, "hoa")) facts.hoa = home.hoa > 0 ? home.hoa : null;
  if (!has(facts, "lotAcres")) facts.lotAcres = parseLotAcres(home.lot);
  if (!has(facts, "garageCars")) facts.garageCars = parseGarageCars(home.garage);
  if (!has(facts, "pool")) facts.pool = home.pool;
  if (!has(facts, "gated")) facts.gated = home.gated;

  facts.monthlyOwnershipCost =
    options.monthlyOwnershipCost !== undefined
      ? options.monthlyOwnershipCost
      : typeof facts.monthlyOwnershipCost === "number"
        ? facts.monthlyOwnershipCost
        : null;

  return facts;
}

export function isCatalogFeature(key: string) {
  return Boolean(FEATURE_BY_KEY[key]);
}

/** Custom feature keys used by the user's requirements. */
export function customFeatureKeys(requirements: WishlistRequirement[]) {
  const keys = new Map<string, string>();
  for (const requirement of requirements) {
    if (isCatalogFeature(requirement.featureKey)) continue;
    if (requirement.featureKey === "monthlyOwnershipCost") continue;
    keys.set(requirement.featureKey, requirement.name);
  }
  return [...keys.entries()].map(([key, label]) => ({ key, label }));
}

export function factIsKnown(value: FactValue | undefined): boolean {
  return value !== null && value !== undefined && value !== "";
}
