/** Comparison selection helpers keep the mobile default predictable. */
export function defaultComparisonIds(
  homes: Array<{ id: string }>,
  count = 2,
): string[] {
  if (homes.length === 0) return [];
  return homes.slice(0, Math.max(1, Math.min(count, homes.length))).map(
    (home) => home.id,
  );
}

export function normalizeComparisonIds(
  homes: Array<{ id: string }>,
  selectedIds: string[],
  minimum = 2,
): string[] {
  const valid = homes
    .map((home) => home.id)
    .filter((id) => selectedIds.includes(id));
  if (valid.length > 0) return valid;
  return defaultComparisonIds(homes, minimum);
}

export function toggleComparisonId(
  homes: Array<{ id: string }>,
  selectedIds: string[],
  id: string,
  minimum = 2,
): string[] {
  const current = normalizeComparisonIds(homes, selectedIds, minimum);
  if (current.includes(id)) {
    if (current.length <= Math.min(minimum, homes.length)) return current;
    return current.filter((entry) => entry !== id);
  }
  return homes
    .map((home) => home.id)
    .filter((entry) => entry === id || current.includes(entry));
}

export function selectedHomes<T extends { id: string }>(
  homes: T[],
  selectedIds: string[],
  minimum = 2,
): T[] {
  const ids = normalizeComparisonIds(homes, selectedIds, minimum);
  return ids
    .map((id) => homes.find((home) => home.id === id))
    .filter((home): home is T => Boolean(home));
}
