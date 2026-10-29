const SUFFIX_ALIASES: Record<string, string> = {
  street: "st",
  avenue: "ave",
  drive: "dr",
  road: "rd",
  boulevard: "blvd",
  lane: "ln",
  court: "ct",
  place: "pl",
  terrace: "ter",
  trail: "trl",
  parkway: "pkwy",
  highway: "hwy",
  circle: "cir",
};

const DIRECTION_ALIASES: Record<string, string> = {
  n: "north",
  s: "south",
  e: "east",
  w: "west",
  ne: "northeast",
  nw: "northwest",
  se: "southeast",
  sw: "southwest",
};

const CORE_SUFFIXES = new Set([
  ...Object.values(SUFFIX_ALIASES),
  "way",
  "plz",
  "sq",
]);

/**
 * Turn the street portion of an address into comparable tokens so that
 * "3558 W 108th St" and "3558 West 108th Street" match, while a different
 * suffix such as Terrace or a different house number does not.
 */
export function streetTokens(address: string) {
  const street = address.split(",")[0] ?? "";
  return street
    .toLowerCase()
    .replace(/[.#]/g, " ")
    .replace(/\b(apt|apartment|unit|ste|suite)\b.*$/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    // Public records abbreviate ordinals: "108th Street" becomes "108 ST".
    .map((token) => token.replace(/^(\d+)(st|nd|rd|th)$/, "$1"))
    .map((token) => SUFFIX_ALIASES[token] ?? DIRECTION_ALIASES[token] ?? token);
}

/**
 * Guard against RentCast returning a nearby property instead of the exact
 * address that was typed. Requires the same house number, the same street
 * suffix and strong token overlap.
 */
export function addressesMatch(requested: string, resolved: string) {
  if (!requested.trim() || !resolved.trim()) return false;

  const left = streetTokens(requested);
  const right = streetTokens(resolved);
  if (left.length === 0 || right.length === 0) return false;

  const leftHasNumber = /^\d+$/.test(left[0]);
  const rightHasNumber = /^\d+$/.test(right[0]);

  // A street-only address must never inherit facts from a specific house on
  // that street (or the other way around).
  if (leftHasNumber !== rightHasNumber) return false;

  if (leftHasNumber && left[0] !== right[0]) {
    return false;
  }

  const leftSuffix = left[left.length - 1];
  const rightSuffix = right[right.length - 1];
  if (
    (CORE_SUFFIXES.has(leftSuffix) || CORE_SUFFIXES.has(rightSuffix)) &&
    leftSuffix !== rightSuffix
  ) {
    return false;
  }

  const [shorter, longer] =
    left.length <= right.length ? [left, right] : [right, left];
  const remaining = [...longer];
  let hits = 0;
  for (const token of shorter) {
    const index = remaining.indexOf(token);
    if (index >= 0) {
      hits += 1;
      remaining.splice(index, 1);
    }
  }

  return hits / shorter.length >= 0.8;
}

/**
 * Detect addresses that share a house number and street name but use a
 * different suffix, e.g. 3558 West 108th Street vs 3558 West 108th Terrace.
 */
export function isNearDuplicateAddress(left: string, right: string) {
  const a = streetTokens(left);
  const b = streetTokens(right);
  if (a.length < 3 || b.length < 3) return false;
  if (a[0] !== b[0]) return false;
  return (
    a.slice(0, -1).join(" ") === b.slice(0, -1).join(" ") &&
    a[a.length - 1] !== b[b.length - 1]
  );
}
