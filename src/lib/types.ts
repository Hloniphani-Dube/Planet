export type IssueCategory =
  | "nutrient_deficiency"
  | "pest_damage"
  | "disease"
  | "water_stress"
  | "healthy"
  | "unknown";

export interface Diagnosis {
  plantName: string;
  category: IssueCategory;
  summary: string;
  fix: string;
  confidence: "low" | "medium" | "high";
}

export interface PlantReport {
  id: string;
  userId: string;
  photoUrls: string[];
  diagnosis: Diagnosis;
  lat?: number;
  lng?: number;
  resolved: boolean;
  helpfulCount: number;
  reactedByMe: boolean;
  createdAt: number;
  synced: boolean;
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
  plantReportId: string;
  plantName: string;
  task: "water" | "fertilize" | "prune";
  dueAt: number;
  done: boolean;
}

export type AiProvider = "claude" | "openai" | "gemini";

export interface ProviderStatusRow {
  id: AiProvider;
  label: string;
  hasKey: boolean;
  active: boolean;
}
