/**
 * Minimal ownership helpers. Records are private to an owner; the legacy
 * shared workspace is represented by a single "shared" owner so the current
 * no-login deployment keeps working. When Supabase Auth is enabled, pass the
 * authenticated user id instead.
 */

export const SHARED_OWNER = "shared";

export type Owned = { ownerId: string };

export function isOwner(record: Owned, ownerId: string): boolean {
  return Boolean(ownerId) && record.ownerId === ownerId;
}

/** Return only records that belong to this owner. */
export function scopeToOwner<T extends Owned>(
  records: T[],
  ownerId: string,
): T[] {
  return records.filter((record) => isOwner(record, ownerId));
}

/**
 * Guard writes so a client cannot accidentally update another owner's row.
 * Throws instead of silently writing to the wrong account.
 */
export function assertOwner(record: Owned, ownerId: string): void {
  if (!isOwner(record, ownerId)) {
    throw new Error("Not allowed to access another owner's record");
  }
}
