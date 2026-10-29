import { addressesMatch } from "./address-match";

/**
 * Miami-Dade County publishes its parcel roll as an open ArcGIS layer. It is
 * free, needs no key, and includes bedrooms, bathrooms, living area, lot size
 * and year built. Coverage is Miami-Dade only; other counties need their own
 * provider.
 */
const ENDPOINT =
  "https://gisweb.miamidade.gov/arcgis/rest/services/MD_LandInformation/MapServer/26/query";

const OUT_FIELDS = [
  "TRUE_SITE_ADDR",
  "TRUE_SITE_CITY",
  "TRUE_SITE_ZIP_CODE",
  "DOR_DESC",
  "BEDROOM_COUNT",
  "BATHROOM_COUNT",
  "HALF_BATHROOM_COUNT",
  "BUILDING_ACTUAL_AREA",
  "LOT_SIZE",
  "YEAR_BUILT",
].join(",");

type ParcelAttributes = {
  TRUE_SITE_ADDR?: string | null;
  TRUE_SITE_CITY?: string | null;
  TRUE_SITE_ZIP_CODE?: string | null;
  DOR_DESC?: string | null;
  BEDROOM_COUNT?: number | null;
  BATHROOM_COUNT?: number | null;
  HALF_BATHROOM_COUNT?: number | null;
  BUILDING_ACTUAL_AREA?: number | null;
  LOT_SIZE?: number | null;
  YEAR_BUILT?: number | null;
};

type ArcGisResponse = {
  features?: { attributes?: ParcelAttributes }[];
  error?: { message?: string };
};

export type PublicRecordFacts = {
  address: string;
  city: string;
  zip: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  propertyType: string;
  lastSaleDate: string;
  lastSalePrice: number | null;
};

export type ParcelLookup =
  | { status: "found"; facts: PublicRecordFacts }
  | { status: "not-found" }
  | { status: "unavailable" };

function positive(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function describeProperty(dor: string | null | undefined) {
  const text = (dor ?? "").toUpperCase();
  if (text.includes("SINGLE FAMILY")) return "Single family";
  if (text.includes("TOWNHOUSE")) return "Townhouse";
  if (text.includes("CONDOMINIUM") || text.includes("CONDO")) return "Condo";
  if (text.includes("VACANT")) return "Vacant land";
  if (text.includes("DUPLEX")) return "Duplex";
  if (text.includes("TRIPLEX")) return "Triplex";
  if (text.includes("MULTI")) return "Multi-family";
  const label = text.split(":")[0]?.trim();
  return label ? label.charAt(0) + label.slice(1).toLowerCase() : "";
}

/** Pull the house number, street name and ZIP out of a free-form address. */
function parseAddress(address: string) {
  const [street = ""] = address.split(",");
  const tokens = street
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(apt|apartment|unit|ste|suite)\b.*$/, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.replace(/^(\d+)(st|nd|rd|th)$/, "$1"));

  const houseNumber = tokens.find((token) => /^\d+$/.test(token)) ?? "";
  const nameToken =
    tokens.find((token) => /^\d+$/.test(token) && token !== houseNumber) ?? "";

  const zip = address.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] ?? "";

  if (!houseNumber) return null;
  return { houseNumber, nameToken, zip };
}

/**
 * How miami-dade spells its street names: "3558 W 108 ST".
 */
function buildWhere(address: string) {
  const parsed = parseAddress(address);
  if (!parsed) return null;

  const clauses = [`TRUE_SITE_ADDR LIKE '${parsed.houseNumber} %'`];
  if (parsed.nameToken) {
    clauses.push(`TRUE_SITE_ADDR LIKE '%${parsed.nameToken}%'`);
  }
  if (parsed.zip) {
    clauses.push(`TRUE_SITE_ZIP_CODE LIKE '${parsed.zip}%'`);
  }

  return clauses.join(" AND ");
}

function toFacts(attributes: ParcelAttributes): PublicRecordFacts {
  const fullBaths = positive(attributes.BATHROOM_COUNT) ?? 0;
  const halfBaths = positive(attributes.HALF_BATHROOM_COUNT) ?? 0;
  const bathrooms = fullBaths + halfBaths * 0.5;

  return {
    address: (attributes.TRUE_SITE_ADDR ?? "").trim(),
    city: (attributes.TRUE_SITE_CITY ?? "").trim(),
    zip: (attributes.TRUE_SITE_ZIP_CODE ?? "").slice(0, 5),
    bedrooms: positive(attributes.BEDROOM_COUNT),
    bathrooms: bathrooms > 0 ? bathrooms : null,
    squareFootage: positive(attributes.BUILDING_ACTUAL_AREA),
    lotSize: positive(attributes.LOT_SIZE),
    yearBuilt: positive(attributes.YEAR_BUILT),
    propertyType: describeProperty(attributes.DOR_DESC),
    lastSaleDate: "",
    lastSalePrice: null,
  };
}

/**
 * Look up a parcel by exact address. Miami-Dade's own address column is
 * abbreviated ("3558 W 108 ST"), so candidates are filtered through the same
 * strict matcher used for every other provider.
 */
export async function lookupMiamiDadeParcel(
  address: string,
): Promise<ParcelLookup> {
  const where = buildWhere(address);
  if (!where) return { status: "not-found" };

  const url = new URL(ENDPOINT);
  url.searchParams.set("where", where);
  url.searchParams.set("outFields", OUT_FIELDS);
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", "50");
  url.searchParams.set("f", "json");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`Miami-Dade parcel lookup responded ${response.status}`);
      return { status: "unavailable" };
    }

    const payload = (await response.json()) as ArcGisResponse;
    if (payload.error) {
      console.warn("Miami-Dade parcel lookup failed:", payload.error.message);
      return { status: "unavailable" };
    }

    const candidates = (payload.features ?? [])
      .map((feature) => feature.attributes)
      .filter((attributes): attributes is ParcelAttributes =>
        Boolean(attributes?.TRUE_SITE_ADDR),
      )
      .filter((attributes) =>
        addressesMatch(address, attributes.TRUE_SITE_ADDR ?? ""),
      )
      .map(toFacts);

    if (candidates.length === 0) return { status: "not-found" };

    // Condo parcels can repeat a street address; prefer the record with facts.
    const match = candidates.find(
      (facts) =>
        facts.bedrooms != null ||
        facts.squareFootage != null ||
        facts.lotSize != null,
    );

    return { status: "found", facts: match ?? candidates[0] };
  } catch (error) {
    console.warn("Miami-Dade parcel lookup failed:", error);
    return { status: "unavailable" };
  }
}
