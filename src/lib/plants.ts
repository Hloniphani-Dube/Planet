import { ensureAnonymousSession, supabase } from "./supabase";
import { mapReportRow } from "./reports";
import type { CareProfile, Diagnosis, Plant, PlantReport } from "./types";

interface CreatePlantInput {
  name: string;
  species?: string;
  environment?: "indoor" | "outdoor";
  location?: string;
  careProfile?: CareProfile;
  photoUrl?: string;
  healthStatus?: Plant["healthStatus"];
}

function mapRow(row: Record<string, unknown>): Plant {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    species: (row.species as string | null) ?? undefined,
    photoUrls: (row.photo_urls as string[] | null) ?? [],
    environment: (row.environment as "indoor" | "outdoor" | null) ?? undefined,
    plantingDate: (row.planting_date as string | null) ?? undefined,
    location: (row.location as string | null) ?? undefined,
    healthStatus: row.health_status as Plant["healthStatus"],
    careProfile: (row.care_profile as CareProfile | null) ?? undefined,
    createdAt: new Date(row.created_at as string).getTime(),
  };
}

export async function listPlants(): Promise<Plant[]> {
  const user = await ensureAnonymousSession();
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getPlant(id: string): Promise<Plant | null> {
  const { data, error } = await supabase.from("plants").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createPlant(input: CreatePlantInput): Promise<Plant> {
  const user = await ensureAnonymousSession();
  const { data, error } = await supabase
    .from("plants")
    .insert({
      user_id: user.id,
      name: input.name,
      species: input.species,
      environment: input.environment,
      location: input.location,
      care_profile: input.careProfile,
      photo_urls: input.photoUrl ? [input.photoUrl] : [],
      health_status: input.healthStatus ?? "unknown",
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Keeps the plant profile in step with its latest scan: health dot, cover photo, and a
 * care profile / species if it didn't have one yet. */
export async function updatePlantAfterScan(
  plant: Plant,
  diagnosis: Diagnosis,
  photoUrl?: string,
): Promise<Plant> {
  const patch: Record<string, unknown> = { health_status: diagnosis.healthStatus };
  if (photoUrl) patch.photo_urls = [photoUrl];
  if (!plant.careProfile) patch.care_profile = diagnosis.careProfile;
  if (!plant.species && diagnosis.scientificName) patch.species = diagnosis.scientificName;

  const { data, error } = await supabase
    .from("plants")
    .update(patch)
    .eq("id", plant.id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deletePlant(id: string): Promise<void> {
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw error;
}

/** The plant's diagnosis timeline: every report linked to it, most recent first. */
export async function getPlantReports(plantId: string): Promise<PlantReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("plant_id", plantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapReportRow(row));
}
