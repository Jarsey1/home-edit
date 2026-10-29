import { addressesMatch } from "./address-match";
import type { PublicRecordFacts } from "./miami-dade-parcels";
import { US_STATES } from "./us-states";

type StoredHomeRow = {
  id: string;
  address: string;
  city: string;
  beds: number | string;
  baths: number | string;
  sqft: number | string;
  lot: string;
  year_built: number | string;
  type: string;
};

export type StoredFacts = {
  id: string;
  facts: PublicRecordFacts;
};

const CACHE_TTL_MS = 5 * 1000;
let cachedRows: { at: number; rows: StoredHomeRow[] } | null = null;

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Turn the formatted lot label back into square feet for comparisons. */
function parseLotSize(label: string) {
  const value = label.trim().toLowerCase();
  if (!value) return null;
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (value.includes("ac")) return Math.round(amount * 43_560);
  return Math.round(amount);
}

function splitCity(city: string) {
  const [name = "", rest = ""] = city.split(",");
  return {
    city: name.trim(),
    zip: rest.match(/\b(\d{5})\b/)?.[1] ?? "",
  };
}

function normalizeLocality(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stateCodeFrom(value: string) {
  const normalized = normalizeLocality(value);
  if (!normalized) return null;
  const words = new Set(normalized.split(" "));
  return (
    US_STATES.find(
      (state) =>
        words.has(state.code.toLowerCase()) ||
        normalized.includes(state.name.toLowerCase()),
    )?.code ?? null
  );
}

function localityFromCityField(city: string) {
  const [name = "", ...rest] = city.split(",");
  return {
    city: normalizeLocality(name),
    state: stateCodeFrom(rest.join(" ")),
  };
}

function localityFromAddress(address: string) {
  const parts = address.split(",").map((part) => part.trim());
  if (parts.length < 2) return null;
  return {
    city: normalizeLocality(parts[1] ?? ""),
    state: stateCodeFrom(parts.slice(2).join(" ")),
  };
}

/**
 * A matching street still belongs to a different home when it is in another
 * city or state. Only compare locality when both sides provide one, so older
 * rows saved without a city keep working.
 */
function localityMatches(requested: string, storedCity: string) {
  const wanted = localityFromAddress(requested);
  const saved = localityFromCityField(storedCity);
  if (!wanted || !saved) return true;
  if (wanted.state && saved.state && wanted.state !== saved.state) return false;
  if (wanted.city && saved.city && wanted.city !== saved.city) return false;
  return true;
}

async function loadHomes(): Promise<StoredHomeRow[]> {
  if (cachedRows && Date.now() - cachedRows.at < CACHE_TTL_MS) {
    return cachedRows.rows;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return [];

  try {
    const response = await fetch(
      `${url}/rest/v1/homes?select=id,address,city,beds,baths,sqft,lot,year_built,type&limit=500`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return [];
    const rows = (await response.json()) as StoredHomeRow[];
    cachedRows = { at: Date.now(), rows };
    return rows;
  } catch (error) {
    console.warn("Stored property lookup failed:", error);
    return [];
  }
}

/**
 * Use the shared Supabase shortlist as the first source of truth. Once a home
 * has been saved with public-record facts, every device can read them back
 * without calling the county again.
 */
export async function findStoredHome(
  address: string,
): Promise<StoredFacts | null> {
  const rows = await loadHomes();
  const row = rows.find(
    (home) =>
      home.address &&
      addressesMatch(address, home.address) &&
      localityMatches(address, home.city ?? "") &&
      (toNumber(home.beds) ||
        toNumber(home.baths) ||
        toNumber(home.sqft) ||
        toNumber(home.year_built) ||
        parseLotSize(home.lot ?? "")),
  );
  if (!row) return null;

  const { city, zip } = splitCity(row.city ?? "");
  const beds = toNumber(row.beds);
  const baths = toNumber(row.baths);
  const sqft = toNumber(row.sqft);
  const yearBuilt = toNumber(row.year_built);

  return {
    id: row.id,
    facts: {
      address: row.address,
      city,
      zip,
      bedrooms: beds && beds > 0 ? beds : null,
      bathrooms: baths && baths > 0 ? baths : null,
      squareFootage: sqft && sqft > 0 ? sqft : null,
      lotSize: parseLotSize(row.lot ?? ""),
      yearBuilt: yearBuilt && yearBuilt > 0 ? yearBuilt : null,
      propertyType: row.type ?? "",
      lastSaleDate: "",
      lastSalePrice: null,
    },
  };
}
