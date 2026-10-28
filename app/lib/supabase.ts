import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Null when the project has no Supabase credentials. The app then falls back
 * to on-device storage so it still works during local development.
 */
export const supabase: SupabaseClient | null =
  url && publicKey
    ? createClient(url, publicKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const hasSupabaseConfig = Boolean(url && publicKey);
