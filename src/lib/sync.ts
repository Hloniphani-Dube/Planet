import { db as localDb, type QueuedUpload } from "./db";
import { supabase, ensureAnonymousSession } from "./supabase";
import { diagnosePlant } from "./api";
import { createPlant, getPlant, updatePlantAfterScan } from "./plants";
import { scheduleFromDiagnosis } from "./careTasks";
import type { BlurredPoint } from "./geo";
import type { CareCalendarEntry, Diagnosis, Plant, PlantReport } from "./types";

let syncing = false;

export type QueueOptions = Omit<QueuedUpload, "id" | "photoBlobs" | "createdAt">;

export async function queuePhotos(photoBlobs: Blob[], options: QueueOptions = {}): Promise<string> {
  const id = crypto.randomUUID();
  await localDb.uploadQueue.add({ id, photoBlobs, createdAt: Date.now(), ...options });
  return id;
}

interface SaveReportOptions {
  location?: BlurredPoint;
  /** Attaches this report to an existing plant profile and updates its health status. */
  plantId?: string;
}

/** Uploads the photos, inserts the report row, and caches it locally. */
export async function saveReport(
  photoBlobs: Blob[],
  diagnosis: Diagnosis,
  options: SaveReportOptions = {},
): Promise<PlantReport> {
  const { location, plantId } = options;
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
      plant_id: plantId,
      photo_urls: photoUrls,
      plant_name: diagnosis.plantName,
      scientific_name: diagnosis.scientificName || null,
      identification_confidence: diagnosis.identificationConfidence,
      category: diagnosis.category,
      summary: diagnosis.summary,
      fix: diagnosis.fix,
      confidence: diagnosis.confidence,
      health_status: diagnosis.healthStatus,
      severity_score: diagnosis.severityScore,
      possible_causes: diagnosis.possibleCauses,
      recommended_actions: diagnosis.recommendedActions,
      urgency: diagnosis.urgency,
      follow_up_days: diagnosis.followUpDays,
      limitations: diagnosis.limitations,
      companion_tip: diagnosis.companionTip || null,
      native_alternative: diagnosis.nativeAlternative || null,
      care_profile: diagnosis.careProfile,
      care_tasks: diagnosis.careTasks,
      lat: location?.lat,
      lng: location?.lng,
      geohash: location?.geohash,
    })
    .select()
    .single();
  if (insertError) throw insertError;

  const report: PlantReport = {
    id: inserted.id,
    userId: user.id,
    plantId,
    photoUrls,
    diagnosis,
    lat: location?.lat,
    lng: location?.lng,
    geohash: location?.geohash,
    resolved: false,
    helpfulCount: 0,
    reactedByMe: false,
    createdAt: new Date(inserted.created_at).getTime(),
    synced: true,
  };
  await localDb.reports.put(report);
  return report;
}

export type PlantChoice =
  | { kind: "existing"; plant: Plant }
  | { kind: "new"; name?: string; environment?: "indoor" | "outdoor" }
  | { kind: "none" };

export interface GardenSaveResult {
  report: PlantReport;
  plant?: Plant;
  reminders: CareCalendarEntry[];
}

/** The whole "a scan becomes part of the garden" step: save the report, create or update
 * the plant profile, and turn the diagnosis into reminders. Used by the live scan flow and
 * by the offline queue, so a delayed scan ends up in exactly the same place. */
export async function saveDiagnosisToGarden(input: {
  photos: Blob[];
  diagnosis: Diagnosis;
  choice: PlantChoice;
  location?: BlurredPoint;
}): Promise<GardenSaveResult> {
  const { photos, diagnosis, choice, location } = input;

  let plant: Plant | undefined = choice.kind === "existing" ? choice.plant : undefined;
  if (choice.kind === "new") {
    plant = await createPlant({
      name: choice.name?.trim() || diagnosis.plantName,
      species: diagnosis.scientificName || undefined,
      environment: choice.environment,
      careProfile: diagnosis.careProfile,
      healthStatus: diagnosis.healthStatus,
    });
  }

  const report = await saveReport(photos, diagnosis, { location, plantId: plant?.id });

  if (plant) {
    try {
      plant = await updatePlantAfterScan(plant, diagnosis, report.photoUrls[0]);
    } catch (err) {
      // The report itself is saved; a stale cover photo or health dot isn't worth failing over.
      console.error("Couldn't update the plant after scanning", err);
    }
  }

  const reminders = await scheduleFromDiagnosis({
    reportId: report.id,
    photoUrl: report.photoUrls[0],
    target: { plantId: plant?.id, plantName: plant?.name ?? diagnosis.plantName },
    diagnosis,
    profile: plant?.careProfile ?? diagnosis.careProfile,
  });

  return { report, plant, reminders };
}

export async function processQueue(): Promise<void> {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  try {
    const pending = await localDb.uploadQueue.toArray();
    for (const item of pending) {
      try {
        const diagnosis = await diagnosePlant(item.photoBlobs, item.weatherContext, item.userNotes);

        let choice: PlantChoice = { kind: "none" };
        if (item.plantId) {
          const plant = await getPlant(item.plantId);
          if (plant) choice = { kind: "existing", plant };
        } else if (item.addToGarden) {
          choice = { kind: "new", name: item.plantNameInput, environment: item.environment };
        }

        await saveDiagnosisToGarden({
          photos: item.photoBlobs,
          diagnosis,
          choice,
          location: item.location,
        });
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
