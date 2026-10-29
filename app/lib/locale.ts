export type Locale = "en" | "es";

export const LOCALE_COOKIE = "nhe-lang";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}
