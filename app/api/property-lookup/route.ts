import { addressesMatch } from "../../lib/address-match";

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

type LookupResult = {
  found: boolean;
  details?: PropertyDetails;
  unavailable?: boolean;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; result: LookupResult }>();

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDetails(property: RentCastProperty): PropertyDetails {
  return {
    address: property.formattedAddress?.trim() ?? "",
    bedrooms: toNumber(property.bedrooms),
    bathrooms: toNumber(property.bathrooms),
    squareFootage: toNumber(property.squareFootage),
    lotSize: toNumber(property.lotSize),
    yearBuilt: toNumber(property.yearBuilt),
    propertyType: property.propertyType?.trim() ?? "",
    lastSaleDate: property.lastSaleDate?.trim() ?? "",
    lastSalePrice: toNumber(property.lastSalePrice),
  };
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

  const apiKey = process.env.RENTCAST_API_KEY?.trim();
  if (!apiKey) {
    return respond({ found: false, unavailable: true });
  }

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
      const result: LookupResult = { found: false };
      remember(cacheKey, result);
      return respond(result);
    }

    if (!response.ok) {
      console.warn(
        `Property lookup failed: RentCast responded ${response.status}`,
      );
      return respond({ found: false, unavailable: true });
    }

    const payload = (await response.json()) as
      | RentCastProperty[]
      | RentCastProperty
      | null;
    const property = Array.isArray(payload) ? payload[0] : payload;

    if (!property) {
      const result: LookupResult = { found: false };
      remember(cacheKey, result);
      return respond(result);
    }

    // RentCast returns the closest match, which can be a neighbouring address.
    // Never prefill facts from a property that is not the address requested.
    if (
      property.formattedAddress &&
      !addressesMatch(address, property.formattedAddress)
    ) {
      console.warn(
        `Property lookup mismatch: asked for "${address}", got "${property.formattedAddress}"`,
      );
      const result: LookupResult = { found: false };
      remember(cacheKey, result);
      return respond(result);
    }

    const result: LookupResult = {
      found: true,
      details: buildDetails(property),
    };
    remember(cacheKey, result);
    return respond(result);
  } catch (error) {
    console.warn("Property lookup failed:", error);
    return respond({ found: false, unavailable: true });
  }
}
