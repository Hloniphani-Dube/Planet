import { db as localDb } from "./db";
import { diagnosisFromRow } from "./diagnosis";
import { boundingBox, type LatLng } from "./geo";
import { ensureAnonymousSession, supabase } from "./supabase";
import type { PlantReport } from "./types";

type Row = Record<string, unknown>;

/** Maps a `reports` row (optionally with an embedded reaction count) to a PlantReport. */
export function mapReportRow(row: Row, reactedIds?: Set<string>): PlantReport {
  const reactions = row.report_reactions as { count?: number }[] | undefined;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    plantId: (row.plant_id as string | null) ?? undefined,
    photoUrls: (row.photo_urls as string[] | null) ?? [],
    diagnosis: diagnosisFromRow(row),
    lat: (row.lat as number | null) ?? undefined,
    lng: (row.lng as number | null) ?? undefined,
    geohash: (row.geohash as string | null) ?? undefined,
    resolved: Boolean(row.resolved),
    helpfulCount: reactions?.[0]?.count ?? 0,
    reactedByMe: reactedIds?.has(row.id as string) ?? false,
    createdAt: new Date(row.created_at as string).getTime(),
    synced: true,
  };
}

export async function getReport(id: string): Promise<PlantReport | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*, report_reactions(count)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapReportRow(data) : null;
}

/** Every report the current person has made, oldest first, for growth tracking. Falls back
 * to the on-device cache when the network is unavailable. */
export async function listMyReports(): Promise<PlantReport[]> {
  try {
    const user = await ensureAnonymousSession();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => mapReportRow(row));
  } catch (err) {
    console.error("Falling back to cached reports", err);
    const cached = await localDb.reports.orderBy("createdAt").toArray();
    return cached.map((report) => ({ ...report, diagnosis: diagnosisFromCache(report) }));
  }
}

function diagnosisFromCache(report: PlantReport) {
  // Reports cached before the diagnosis gained new fields are missing them.
  return diagnosisFromRow({
    plant_name: report.diagnosis.plantName,
    scientific_name: report.diagnosis.scientificName,
    identification_confidence: report.diagnosis.identificationConfidence,
    category: report.diagnosis.category,
    summary: report.diagnosis.summary,
    fix: report.diagnosis.fix,
    confidence: report.diagnosis.confidence,
    health_status: report.diagnosis.healthStatus,
    severity_score: report.diagnosis.severityScore,
    possible_causes: report.diagnosis.possibleCauses,
    recommended_actions: report.diagnosis.recommendedActions,
    urgency: report.diagnosis.urgency,
    follow_up_days: report.diagnosis.followUpDays,
    limitations: report.diagnosis.limitations,
    companion_tip: report.diagnosis.companionTip,
    native_alternative: report.diagnosis.nativeAlternative,
    care_profile: report.diagnosis.careProfile,
    care_tasks: report.diagnosis.careTasks,
  });
}

export interface CommunityQuery {
  /** When set, only reports inside this radius of the point. */
  near?: { center: LatLng; radiusKm: number };
  limit?: number;
}

export interface CommunityResult {
  reports: PlantReport[];
  userId: string;
}

/** Recent public reports with helpful counts. With `near`, uses a bounding box on the
 * (already blurred) coordinates, so the query stays cheap and needs no PostGIS. */
export async function listCommunityReports(query: CommunityQuery = {}): Promise<CommunityResult> {
  const user = await ensureAnonymousSession();

  let request = supabase
    .from("reports")
    .select("*, report_reactions(count)")
    .order("created_at", { ascending: false })
    .limit(query.limit ?? 200);

  if (query.near) {
    const box = boundingBox(query.near.center, query.near.radiusKm);
    request = request
      .gte("lat", box.minLat)
      .lte("lat", box.maxLat)
      .gte("lng", box.minLng)
      .lte("lng", box.maxLng);
  }

  const [{ data, error }, { data: myReactions }] = await Promise.all([
    request,
    supabase.from("report_reactions").select("report_id").eq("user_id", user.id),
  ]);
  if (error) throw error;

  const reactedIds = new Set((myReactions ?? []).map((row) => row.report_id as string));
  return { reports: (data ?? []).map((row) => mapReportRow(row, reactedIds)), userId: user.id };
}
