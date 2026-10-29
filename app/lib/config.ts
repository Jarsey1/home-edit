/** Product thresholds that should be configurable in one place. */
const envThreshold = Number(
  process.env.NEXT_PUBLIC_PRICE_WARNING_THRESHOLD ?? "",
);

export const PRICE_WARNING_THRESHOLD =
  Number.isFinite(envThreshold) && envThreshold > 0
    ? envThreshold
    : 25_000;

/** Default annual assumption rates used when a listing has no tax/insurance data. */
export const DEFAULT_TAX_RATE = 0.0072; // 0.72% of price per year
export const DEFAULT_INSURANCE_RATE = 0.0024; // 0.24% of price per year
export const DEFAULT_MAINTENANCE_RATE = 0.0013; // 0.13% of price per year
