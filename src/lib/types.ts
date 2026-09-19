export type IssueCategory =
  | "nutrient_deficiency"
  | "pest_damage"
  | "disease"
  | "water_stress"
  | "healthy"
  | "unknown";

export type HealthStatus = "healthy" | "needs_attention" | "critical" | "unknown";
export type Urgency = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export type LightNeed = "low" | "medium" | "bright" | "full_sun";
export type CareTaskType = "water" | "fertilize" | "prune" | "check" | "treat";

/** Lightweight care profile: what a plant needs, in numbers the calendar and the weather
 * alerts can act on. `source` records where it came from so the UI can be honest about it. */
export interface CareProfile {
  light: LightNeed;
  waterEveryDays: number;
  minTempC: number;
  maxTempC: number;
  /** Damaged by frost (air temperatures around 2 C or below), so it triggers frost alerts. */
  frostSensitive: boolean;
  source: "reference" | "ai" | "default";
}

/** A follow-up the AI suggests as part of a diagnosis; the calendar turns these into entries. */
export interface SuggestedCareTask {
  task: CareTaskType;
  /** Days from now that it should be done. 0 means today. */
  inDays: number;
  /** Why, in a few words ("Apply diluted Epsom salt at the base"). */
  note: string;
  /** 0 for a one-off; otherwise the next reminder is created this many days after completion. */
  repeatEveryDays: number;
}

export interface Diagnosis {
  plantName: string;
  scientificName: string;
  identificationConfidence: Confidence;
  category: IssueCategory;
  /** Plain-language explanation of what's visible in the photo ("what Planet-i-Green sees"). */
  summary: string;
  /** The single clearest recommended fix, kept for the compact card view and the community feed. */
  fix: string;
  confidence: Confidence;
  healthStatus: HealthStatus;
  /** 0 (no visible problem) to 10 (plant likely to die without action). Lower is better. */
  severityScore: number;
  /** Ranked, most-likely-first. Written with cautious language (possible/likely), never as fact. */
  possibleCauses: string[];
  /** Concrete, ordered, low-cost actions, the "what to do now" list. */
  recommendedActions: string[];
  urgency: Urgency;
  /** Recommended number of days until the plant should be checked again. */
  followUpDays: number;
  /** Honest caveat about what a photo alone can't establish, if applicable. */
  limitations: string;
  /** One companion-planting tip relevant to this plant. Empty string if none. */
  companionTip: string;
  /** A native or pollinator-friendly plant to add or swap in. Empty string if none. */
  nativeAlternative: string;
  careProfile: CareProfile;
  careTasks: SuggestedCareTask[];
}

export interface PlantReport {
  id: string;
  userId: string;
  plantId?: string;
  photoUrls: string[];
  diagnosis: Diagnosis;
  /** Blurred to the centre of a geohash cell before it is ever stored. */
  lat?: number;
  lng?: number;
  geohash?: string;
  resolved: boolean;
  helpfulCount: number;
  reactedByMe: boolean;
  createdAt: number;
  synced: boolean;
}

export interface Plant {
  id: string;
  userId: string;
  name: string;
  species?: string;
  photoUrls: string[];
  environment?: "indoor" | "outdoor";
  plantingDate?: string;
  location?: string;
  healthStatus: HealthStatus;
  careProfile?: CareProfile;
  createdAt: number;
}

export interface WeatherContext {
  tempC: number;
  humidity: number;
  description: string;
  lat: number;
  lng: number;
}

export interface CareCalendarEntry {
  id: string;
  /** Report this reminder came from. Empty for reminders that don't come from a scan. */
  plantReportId: string;
  plantId?: string;
  plantName: string;
  task: CareTaskType;
  dueAt: number;
  done: boolean;
  doneAt?: number;
  /** Why this reminder exists, in plain language. */
  note?: string;
  /** First photo of the report it came from, so the reason is recognisable at a glance. */
  photoUrl?: string;
  /** When set, completing this creates the next reminder that many days later. */
  repeatEveryDays?: number;
  /** Remaining repeats. Undefined with repeatEveryDays set means it repeats indefinitely. */
  repeatsLeft?: number;
  /** The entry whose completion created this one, so un-completing can undo the chain. */
  chainedFrom?: string;
  origin?: "diagnosis" | "profile" | "manual";
}

export type AiProvider = "claude" | "openai" | "gemini";

export interface ProviderStatusRow {
  id: AiProvider;
  label: string;
  hasKey: boolean;
  active: boolean;
}

/** A temporary, local-only plant profile used in demo mode. Never touches Supabase;
 * lives only in this browser's IndexedDB for the current session/local experience. */
export interface DemoPlant {
  id: string;
  name: string;
  healthStatus: HealthStatus;
  observations: DemoObservation[];
  createdAt: number;
}

export interface DemoObservation {
  id: string;
  diagnosis: Diagnosis;
  createdAt: number;
}
