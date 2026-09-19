import { invokeFunction } from "./functions";
import { blobToBase64 } from "./blob";
import { normalizeDiagnosis } from "./diagnosis";
import { ensureAnonymousSession } from "./supabase";
import type { Diagnosis } from "./types";

export async function diagnosePlant(
  photos: Blob[],
  weatherContext?: string,
  userNotes?: string,
): Promise<Diagnosis> {
  // The function only answers signed-in callers, so an operator's key can't be spent by
  // anyone who merely knows the URL. Anonymous sessions count.
  await ensureAnonymousSession();

  const images = await Promise.all(
    photos.map(async (photo) => ({
      base64: await blobToBase64(photo),
      mimeType: photo.type || "image/jpeg",
    })),
  );
  const raw = await invokeFunction<unknown>("diagnose-plant", { images, weatherContext, userNotes });
  return normalizeDiagnosis(raw);
}
