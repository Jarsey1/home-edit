import { addressesMatch } from "../../lib/address-match";
import {
  lookupMiamiDadeParcel,
  type PublicRecordFacts,
} from "../../lib/miami-dade-parcels";
import { findStoredHome } from "../../lib/stored-properties";

type RentCastProperty = {
  formattedAddress?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
};

type PropertyDetails = PublicRecordFacts;

type LookupResult = {
  found: boolean;
  details?: PropertyDetails;
  unavailable?: boolean;
};

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { at: number; result: LookupResult }>();

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function remember(key: string, result: LookupResult) {
  cache.set(key, { at: Date.now(), result });
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

function respond(result: LookupResult) {
  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Optional nationwide fallback. RentCast needs a paid (or activated free)
 * subscription, so it is only tried when a key is configured.
 */
async function lookupRentCast(
  address: string,
): Promise<LookupResult | null> {
  const apiKey = process.env.RENTCAST_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const url = new URL("https://api.rentcast.io/v1/properties");
    url.searchParams.set("address", address);
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404) {
      return { found: false };
    }

    // 401/402/403 mean the key exists but the API plan is not usable. That is
    // not an outage, so treat it as "no extra provider" instead of an error.
    if ([401, 402, 403].includes(response.status)) {
      console.warn(
        `Property lookup skipped: RentCast subscription is inactive (${response.status})`,
      );
      return { found: false };
    }

    if (!response.ok) {
      console.warn(
        `Property lookup failed: RentCast responded ${response.status}`,
      );
      return { found: false, unavailable: true };
    }

    const payload = (await response.json()) as
      | RentCastProperty[]
      | RentCastProperty
      | null;
    const property = Array.isArray(payload) ? payload[0] : payload;

    if (!property) return { found: false };

    // RentCast returns the closest match, which can be a neighbouring address.
    // Never prefill facts from a property that is not the address requested.
    if (
      property.formattedAddress &&
      !addressesMatch(address, property.formattedAddress)
    ) {
      console.warn(
        `Property lookup mismatch: asked for "${address}", got "${property.formattedAddress}"`,
      );
      return { found: false };
    }

    return {
      found: true,
      details: {
        address: property.formattedAddress?.trim() ?? "",
        city: "",
        zip: "",
        bedrooms: toNumber(property.bedrooms),
        bathrooms: toNumber(property.bathrooms),
        squareFootage: toNumber(property.squareFootage),
        lotSize: toNumber(property.lotSize),
        yearBuilt: toNumber(property.yearBuilt),
        propertyType: property.propertyType?.trim() ?? "",
        lastSaleDate: property.lastSaleDate?.trim() ?? "",
        lastSalePrice: toNumber(property.lastSalePrice),
      },
    };
  } catch (error) {
    console.warn("Property lookup failed:", error);
    return { found: false, unavailable: true };
  }
}

function hasCompleteFacts(facts: PropertyDetails) {
  return (
    facts.bedrooms != null &&
    facts.bathrooms != null &&
    facts.squareFootage != null &&
    facts.lotSize != null
  );
}

/**
 * Saved facts win because they may include corrections the user made. County
 * data only fills the gaps in older rows.
 */
function mergeFacts(
  stored: PropertyDetails,
  county: PropertyDetails,
): PropertyDetails {
  return {
    address: stored.address || county.address,
    city: stored.city || county.city,
    zip: stored.zip || county.zip,
    bedrooms: stored.bedrooms ?? county.bedrooms,
    bathrooms: stored.bathrooms ?? county.bathrooms,
    squareFootage: stored.squareFootage ?? county.squareFootage,
    lotSize: stored.lotSize ?? county.lotSize,
    yearBuilt: stored.yearBuilt ?? county.yearBuilt,
    propertyType: stored.propertyType || county.propertyType,
    lastSaleDate: stored.lastSaleDate || county.lastSaleDate,
    lastSalePrice: stored.lastSalePrice ?? county.lastSalePrice,
  };
}

export async function GET(request: Request) {
  const address =
    new URL(request.url).searchParams
      .get("address")
      ?.replace(/\s+/g, " ")
      .trim() ?? "";

  if (address.length < 6) {
    return respond({ found: false });
  }

  const cacheKey = address.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return respond(cached.result);
  }

  let providerFailed = false;

  // The shared shortlist is the first source of truth: facts saved with a home
  // are available on every device without calling an outside service again.
  const stored = await findStoredHome(address);
  if (stored && hasCompleteFacts(stored.facts)) {
    const result: LookupResult = { found: true, details: stored.facts };
    remember(cacheKey, result);
    return respond(result);
  }

  // Free county public records next — no key, no subscription.
  const county = await lookupMiamiDadeParcel(address);
  if (county.status === "found") {
    const details = stored
      ? mergeFacts(stored.facts, county.facts)
      : county.facts;
    const result: LookupResult = { found: true, details };
    remember(cacheKey, result);
    return respond(result);
  }
  if (county.status === "unavailable") providerFailed = true;

  if (stored) {
    const result: LookupResult = { found: true, details: stored.facts };
    remember(cacheKey, result);
    return respond(result);
  }

  const rentcast = await lookupRentCast(address);
  if (rentcast?.found) {
    remember(cacheKey, rentcast);
    return respond(rentcast);
  }
  if (rentcast?.unavailable) providerFailed = true;

  const result: LookupResult = providerFailed
    ? { found: false, unavailable: true }
    : { found: false };
  remember(cacheKey, result);
  return respond(result);
}
