import { db as localDb } from "./db";
import { supabase, ensureAnonymousSession } from "./supabase";
import { diagnosePlant } from "./api";
import type { Diagnosis, PlantReport } from "./types";

let syncing = false;

export async function queuePhotos(photoBlobs: Blob[], lat?: number, lng?: number): Promise<string> {
  const id = crypto.randomUUID();
  await localDb.uploadQueue.add({ id, photoBlobs, lat, lng, createdAt: Date.now() });
  return id;
}

/** Uploads the photos, inserts the report row, and caches it locally. Shared by the
 * immediate (online) diagnose flow and the offline queue flush. */
export async function saveReport(
  photoBlobs: Blob[],
  diagnosis: Diagnosis,
  lat?: number,
  lng?: number,
): Promise<PlantReport> {
  const user = await ensureAnonymousSession();

  const photoUrls = await Promise.all(
    photoBlobs.map(async (photoBlob) => {
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("plant-photos")
        .upload(path, photoBlob, { contentType: photoBlob.type || "image/jpeg" });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("plant-photos").getPublicUrl(path);
      return publicUrl;
    }),
  );

  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      photo_urls: photoUrls,
      plant_name: diagnosis.plantName,
      category: diagnosis.category,
      summary: diagnosis.summary,
      fix: diagnosis.fix,
      confidence: diagnosis.confidence,
      lat,
      lng,
    })
    .select()
    .single();
  if (insertError) throw insertError;

  const report: PlantReport = {
    id: inserted.id,
    userId: user.id,
    photoUrls,
    diagnosis,
    lat,
    lng,
    resolved: false,
    helpfulCount: 0,
    reactedByMe: false,
    createdAt: new Date(inserted.created_at).getTime(),
    synced: true,
  };
  await localDb.reports.put(report);
  return report;
}

export async function processQueue(): Promise<void> {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  try {
    const pending = await localDb.uploadQueue.toArray();
    for (const item of pending) {
      try {
        const diagnosis = await diagnosePlant(item.photoBlobs);
        await saveReport(item.photoBlobs, diagnosis, item.lat, item.lng);
        await localDb.uploadQueue.delete(item.id);
      } catch (err) {
        console.error("Failed to sync plant report", item.id, err);
      }
    }
  } finally {
    syncing = false;
  }
}

export function watchConnectivityAndSync(): () => void {
  const handler = () => void processQueue();
  window.addEventListener("online", handler);
  void processQueue();
  return () => window.removeEventListener("online", handler);
}
