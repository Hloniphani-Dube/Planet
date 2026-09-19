import {
  CARE_TASK_TYPES,
  DIAGNOSIS_CATEGORIES,
  HEALTH_STATUSES,
  LIGHT_NEEDS,
} from "./diagnosisSchema";
import {
  catalogCareProfile,
  DEFAULT_CARE_PROFILE,
  findCatalogPlant,
} from "./plantCatalog";
import type {
  CareProfile,
  CareTaskType,
  Confidence,
  Diagnosis,
  HealthStatus,
  IssueCategory,
  SuggestedCareTask,
  Urgency,
} from "./types";

const CONFIDENCES: readonly Confidence[] = ["low", "medium", "high"];
const URGENCIES: readonly Urgency[] = ["low", "medium", "high"];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : [];
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

const SEVERITY_FROM_HEALTH: Record<HealthStatus, number> = {
  healthy: 1,
  needs_attention: 5,
  critical: 8,
  unknown: 3,
};

/** Reference table first (curated, so frost alerts are trustworthy), then what the AI
 * said, then generic defaults that never claim frost sensitivity. */
export function resolveCareProfile(
  plantName: string,
  scientificName: string,
  aiProfile: unknown,
): CareProfile {
  const reference = findCatalogPlant(plantName) ?? findCatalogPlant(scientificName);
  if (reference) return catalogCareProfile(reference);

  if (aiProfile && typeof aiProfile === "object") {
    const raw = aiProfile as Record<string, unknown>;
    const minTempC = finiteNumber(raw.minTempC);
    const maxTempC = finiteNumber(raw.maxTempC);
    if (minTempC !== undefined && maxTempC !== undefined && minTempC < maxTempC) {
      return {
        light: pick(raw.light, LIGHT_NEEDS, DEFAULT_CARE_PROFILE.light),
        waterEveryDays: clampInt(raw.waterEveryDays, 1, 60, DEFAULT_CARE_PROFILE.waterEveryDays),
        minTempC,
        maxTempC,
        frostSensitive: raw.frostSensitive === true,
        source: "ai",
      };
    }
  }
  return { ...DEFAULT_CARE_PROFILE };
}

function normalizeTasks(raw: unknown): SuggestedCareTask[] {
  if (!Array.isArray(raw)) return [];
  const tasks: SuggestedCareTask[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    tasks.push({
      task: pick<CareTaskType>(entry.task, CARE_TASK_TYPES, "check"),
      inDays: clampInt(entry.inDays, 0, 60, 1),
      note: text(entry.note),
      repeatEveryDays: clampInt(entry.repeatEveryDays, 0, 60, 0),
    });
  }
  return tasks.slice(0, 5);
}

/** If the model left out the task list, build a sensible one from the diagnosis itself so
 * the calendar is never empty after a scan. */
function fallbackTasks(category: IssueCategory, urgency: Urgency, fix: string): SuggestedCareTask[] {
  const soon = urgency === "high" ? 0 : 1;
  switch (category) {
    case "pest_damage":
    case "disease":
      return [{ task: "treat", inDays: soon, note: fix, repeatEveryDays: 0 }];
    case "nutrient_deficiency":
      return [{ task: "fertilize", inDays: soon, note: fix, repeatEveryDays: 0 }];
    case "water_stress":
      return [{ task: "water", inDays: soon, note: fix, repeatEveryDays: 0 }];
    default:
      return [];
  }
}

/** Turns whatever a provider returned into a complete, in-range Diagnosis. Providers and
 * older saved rows may leave fields out; everything downstream can rely on them. */
export function normalizeDiagnosis(input: unknown): Diagnosis {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const category = pick<IssueCategory>(raw.category, DIAGNOSIS_CATEGORIES, "unknown");
  const healthStatus = pick<HealthStatus>(raw.healthStatus, HEALTH_STATUSES, "unknown");
  const urgency = pick(raw.urgency, URGENCIES, "medium");
  const fix = text(raw.fix);
  const followUpDays = clampInt(raw.followUpDays, 1, 30, 3);
  const plantName = text(raw.plantName, "Unknown plant") || "Unknown plant";
  const scientificName = text(raw.scientificName);

  const tasks = normalizeTasks(raw.careTasks);
  const combined = tasks.length > 0 ? tasks : fallbackTasks(category, urgency, fix);
  if (!combined.some((task) => task.task === "check")) {
    combined.push({
      task: "check",
      inDays: followUpDays,
      note: "Scan again to see whether it's improving",
      repeatEveryDays: healthStatus === "healthy" ? 0 : followUpDays,
    });
  }

  return {
    plantName,
    scientificName,
    identificationConfidence: pick(raw.identificationConfidence, CONFIDENCES, "medium"),
    category,
    summary: text(raw.summary),
    fix,
    confidence: pick(raw.confidence, CONFIDENCES, "medium"),
    healthStatus,
    severityScore: clampInt(raw.severityScore, 0, 10, SEVERITY_FROM_HEALTH[healthStatus]),
    possibleCauses: textList(raw.possibleCauses),
    recommendedActions: textList(raw.recommendedActions),
    urgency,
    followUpDays,
    limitations: text(raw.limitations),
    companionTip: text(raw.companionTip),
    nativeAlternative: text(raw.nativeAlternative),
    careProfile: resolveCareProfile(plantName, scientificName, raw.careProfile),
    careTasks: combined,
  };
}

/** Same shape as `normalizeDiagnosis`, for a Supabase `reports` row. */
export function diagnosisFromRow(row: Record<string, unknown>): Diagnosis {
  return normalizeDiagnosis({
    plantName: row.plant_name,
    scientificName: row.scientific_name,
    identificationConfidence: row.identification_confidence,
    category: row.category,
    summary: row.summary,
    fix: row.fix,
    confidence: row.confidence,
    healthStatus: row.health_status,
    severityScore: row.severity_score,
    possibleCauses: row.possible_causes,
    recommendedActions: row.recommended_actions,
    urgency: row.urgency,
    followUpDays: row.follow_up_days,
    limitations: row.limitations,
    companionTip: row.companion_tip,
    nativeAlternative: row.native_alternative,
    careProfile: row.care_profile,
    careTasks: row.care_tasks,
  });
}

export const severityBand = (score: number): { label: string; tone: "good" | "watch" | "bad" } => {
  if (score <= 1) return { label: "Minimal", tone: "good" };
  if (score <= 3) return { label: "Mild", tone: "good" };
  if (score <= 6) return { label: "Moderate", tone: "watch" };
  return { label: "Serious", tone: "bad" };
};
