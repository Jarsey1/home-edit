import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  return NextResponse.json({ ok: true });
}
