export type IssueCategory =
  | "nutrient_deficiency"
  | "pest_damage"
  | "disease"
  | "water_stress"
  | "healthy"
  | "unknown";

export interface Diagnosis {
  plantName: string;
  scientificName: string;
  identificationConfidence: "low" | "medium" | "high";
  category: IssueCategory;
  summary: string;
  fix: string;
  confidence: "low" | "medium" | "high";
  healthStatus: "healthy" | "needs_attention" | "critical" | "unknown";
  severityScore: number;
  possibleCauses: string[];
  recommendedActions: string[];
  urgency: "low" | "medium" | "high";
  followUpDays: number;
  limitations: string;
  companionTip: string;
  nativeAlternative: string;
  careProfile: {
    light: "low" | "medium" | "bright" | "full_sun";
    waterEveryDays: number;
    minTempC: number;
    maxTempC: number;
    frostSensitive: boolean;
  };
  careTasks: {
    task: "water" | "fertilize" | "prune" | "check" | "treat";
    inDays: number;
    note: string;
    repeatEveryDays: number;
  }[];
}

export interface ImageInput {
  base64: string;
  mimeType: string;
}

export type AiProvider = "claude" | "openai" | "gemini";
