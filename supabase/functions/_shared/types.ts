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

export interface ImageInput {
  base64: string;
  mimeType: string;
}

export type AiProvider = "claude" | "openai" | "gemini";
