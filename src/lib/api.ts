import { invokeFunction } from "./functions";
import { blobToBase64 } from "./blob";
import type { Diagnosis } from "./types";

export async function diagnosePlant(photos: Blob[], weatherContext?: string): Promise<Diagnosis> {
  const images = await Promise.all(
    photos.map(async (photo) => ({
      base64: await blobToBase64(photo),
      mimeType: photo.type || "image/jpeg",
    })),
  );
  return invokeFunction<Diagnosis>("diagnose-plant", { images, weatherContext });
}
