import type { IssueCategory } from "./types";

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  nutrient_deficiency: "Nutrient deficiency",
  pest_damage: "Pest damage",
  disease: "Disease",
  water_stress: "Water stress",
  healthy: "Healthy",
  unknown: "Unclear",
};

/** Pin and legend colours, chosen to stay distinguishable on both map themes. */
export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  nutrient_deficiency: "#d97706",
  pest_damage: "#dc2626",
  disease: "#7c3aed",
  water_stress: "#2563eb",
  healthy: "#16a34a",
  unknown: "#6b7280",
};

export const CATEGORY_ORDER: IssueCategory[] = [
  "pest_damage",
  "disease",
  "nutrient_deficiency",
  "water_stress",
  "healthy",
  "unknown",
];
