export type NumericParseResult = {
  value: number | null;
  empty: boolean;
  error: "invalid" | "negative" | null;
};

/**
 * Parse a text/number field without turning an intentionally blank optional
 * field into zero. Blank means "unknown", not "0".
 */
export function parseNumericInput(
  raw: string,
  options: { min?: number; max?: number; integer?: boolean } = {},
): NumericParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null, empty: true, error: null };

  let normalized = trimmed.replace(/\s/g, "");
  // Accept "850,000" (grouping) and "2,5" (decimal comma). A comma followed by
  // exactly three digits in a grouped number is treated as a thousands mark.
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/,/g, "");
  } else if (/^\d{1,3}(,\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/,/g, "");
  } else {
    normalized = normalized.replace(/,/g, ".");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return { value: null, empty: false, error: "invalid" };
  }

  const min = options.min ?? 0;
  if (parsed < min) {
    return {
      value: null,
      empty: false,
      error: parsed < 0 ? "negative" : "invalid",
    };
  }
  if (options.max !== undefined && parsed > options.max) {
    return { value: null, empty: false, error: "invalid" };
  }

  return {
    value: options.integer ? Math.round(parsed) : parsed,
    empty: false,
    error: null,
  };
}

export type HomeDraft = {
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  hoa: string;
  garageCars: string;
  yearBuilt: string;
  lotAcres: string;
  listingUrl: string;
};

export type HomeDraftValues = {
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  hoa: number | null;
  garageCars: number | null;
  yearBuilt: number | null;
  lotAcres: number | null;
  listingUrl: string;
};

export type HomeValidation = {
  valid: boolean;
  errors: Partial<Record<keyof HomeDraft, "invalid" | "negative" | "url">>;
  suspiciousPrice: boolean;
  values: HomeDraftValues;
};

const SUSPICIOUS_PRICE = 10_000;

export function validateHomeDraft(draft: HomeDraft): HomeValidation {
  const errors: HomeValidation["errors"] = {};

  const price = parseNumericInput(draft.price, { min: 0 });
  if (price.error) errors.price = price.error;

  const beds = parseNumericInput(draft.beds, { min: 0, max: 50, integer: true });
  if (beds.error) errors.beds = beds.error;

  const baths = parseNumericInput(draft.baths, { min: 0, max: 50 });
  if (baths.error) errors.baths = baths.error;

  const sqft = parseNumericInput(draft.sqft, { min: 0, max: 1_000_000, integer: true });
  if (sqft.error) errors.sqft = sqft.error;

  const hoa = parseNumericInput(draft.hoa, { min: 0, max: 100_000 });
  if (hoa.error) errors.hoa = hoa.error;

  const garageCars = parseNumericInput(draft.garageCars, {
    min: 0,
    max: 20,
    integer: true,
  });
  if (garageCars.error) errors.garageCars = garageCars.error;

  const currentYear = new Date().getFullYear();
  const yearBuilt = parseNumericInput(draft.yearBuilt, {
    min: 1800,
    max: currentYear + 2,
    integer: true,
  });
  if (yearBuilt.error) errors.yearBuilt = yearBuilt.error;

  const lotAcres = parseNumericInput(draft.lotAcres, { min: 0, max: 10_000 });
  if (lotAcres.error) errors.lotAcres = lotAcres.error;

  let listingUrl = draft.listingUrl.trim();
  if (listingUrl) {
    try {
      const parsed = new URL(listingUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.listingUrl = "url";
      }
    } catch {
      // Allow an address typed without a scheme, normalize later.
      if (!/^[a-z0-9.-]+\.[a-z]{2,}/i.test(listingUrl)) {
        errors.listingUrl = "url";
      } else {
        listingUrl = `https://${listingUrl}`;
      }
    }
  }

  const values: HomeDraftValues = {
    price: price.value,
    beds: beds.value,
    baths: baths.value,
    sqft: sqft.value,
    hoa: hoa.value,
    garageCars: garageCars.value,
    yearBuilt: yearBuilt.value,
    lotAcres: lotAcres.value,
    listingUrl,
  };

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    suspiciousPrice:
      values.price !== null && values.price > 0 && values.price < SUSPICIOUS_PRICE,
    values,
  };
}

export function normalizeListingUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
