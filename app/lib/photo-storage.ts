import type { SupabaseClient } from "@supabase/supabase-js";

/** Private bucket. Objects are only readable through a signed URL. */
export const PHOTO_BUCKET = "property-photos";

/** Signed URLs are refreshed on load; seven days covers long sessions. */
export const PHOTO_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Photos are always compressed to JPEG by `compressImageFile`. */
const PHOTO_FILE = "cover.jpg";

export function photoObjectPath(userId: string, homeId: string) {
  return `${userId}/${homeId}/${PHOTO_FILE}`;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",", 2);
  const mimeMatch = /data:([^;]+)/.exec(header ?? "");
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  if (!payload) throw new Error("Invalid image data");
  const binary =
    /;base64/i.test(header ?? "")
      ? atob(payload)
      : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

export type UploadedPhoto = {
  path: string;
  url: string;
};

/**
 * Uploads a compressed data URL to the user's private folder and returns the
 * object path plus a short-lived signed URL for immediate rendering.
 */
export async function uploadPhoto(
  client: SupabaseClient,
  userId: string,
  homeId: string,
  dataUrl: string,
): Promise<UploadedPhoto> {
  const blob = dataUrlToBlob(dataUrl);
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error("Photo is larger than 5 MB");
  }
  const path = photoObjectPath(userId, homeId);
  const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, blob, {
    cacheControl: "3600",
    contentType: blob.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  const { data, error: signError } = await client.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, PHOTO_URL_TTL_SECONDS);
  if (signError || !data?.signedUrl) {
    throw signError ?? new Error("Could not sign the uploaded photo");
  }
  return { path, url: data.signedUrl };
}

export async function removePhoto(client: SupabaseClient, path: string) {
  const { error } = await client.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) throw error;
}

/** Refreshes signed URLs for snapshot photos that live in Storage. */
export async function signedPhotoUrls(
  client: SupabaseClient,
  items: Array<{ homeId: string; path: string }>,
): Promise<Record<string, string>> {
  const paths = Array.from(new Set(items.map((item) => item.path)));
  if (paths.length === 0) return {};
  const { data, error } = await client.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);
  if (error) throw error;
  const byPath = new Map(
    (data ?? [])
      .filter((entry) => entry.signedUrl)
      .map((entry) => [entry.path, entry.signedUrl] as const),
  );
  const byHome: Record<string, string> = {};
  for (const item of items) {
    const url = byPath.get(item.path);
    if (url) byHome[item.homeId] = url;
  }
  return byHome;
}
