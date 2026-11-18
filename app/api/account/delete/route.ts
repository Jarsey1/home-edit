import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LEGACY_TABLES = [
  "comparison_notes",
  "budget_settings",
  "tour_notes",
  "wishlist_items",
  "homes",
] as const;

/**
 * Best-effort cleanup after the auth user is gone. The snapshot row cascades;
 * Storage objects and legacy rows do not.
 */
async function removeUserFiles(admin: SupabaseClient, userId: string) {
  const bucket = admin.storage.from("property-photos");
  const paths: string[] = [];
  const { data: folders, error } = await bucket.list(userId, { limit: 100 });
  if (error) {
    console.warn("Account deletion: could not list photos:", error.message);
    return;
  }
  for (const folder of folders ?? []) {
    if (folder.id === null) {
      const { data: files, error: fileError } = await bucket.list(
        `${userId}/${folder.name}`,
        { limit: 100 },
      );
      if (fileError) {
        console.warn("Account deletion: could not list photo folder:", fileError.message);
        continue;
      }
      for (const file of files ?? []) {
        if (file.id) paths.push(`${userId}/${folder.name}/${file.name}`);
      }
    } else {
      paths.push(`${userId}/${folder.name}`);
    }
  }
  if (paths.length > 0) {
    const { error: removeError } = await bucket.remove(paths);
    if (removeError) {
      console.warn("Account deletion: could not remove photos:", removeError.message);
    }
  }
}

async function removeLegacyRows(admin: SupabaseClient, userId: string) {
  for (const table of LEGACY_TABLES) {
    const { error } = await admin.from(table).delete().eq("owner_id", userId);
    if (error) {
      console.warn(`Account deletion: could not clear ${table}:`, error.message);
    }
  }
}

/**
 * Permanently deletes the authenticated user. The service-role key stays
 * server-side; it is never included in the client bundle.
 *
 * The account snapshot row is deleted by the foreign-key cascade on
 * account_snapshots.owner_id. Wishlists, property details, photos and
 * evaluations live inside that snapshot.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured on this environment." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    userData.user.id,
  );
  if (deleteError) {
    console.error("Account deletion failed:", deleteError.message);
    return NextResponse.json(
      { error: "The account could not be deleted. No partial success was reported." },
      { status: 500 },
    );
  }

  await removeUserFiles(admin, userData.user.id);
  await removeLegacyRows(admin, userData.user.id);

  return NextResponse.json({ ok: true });
}
