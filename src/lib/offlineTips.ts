import type { IssueCategory } from "./types";

export interface OfflineTip {
  category: IssueCategory;
  label: string;
  hint: string;
  fix: string;
}

/** Generic, non-photo-specific advice shown when there's no connection to reach an AI
 * provider. Not a real diagnosis of the photo taken, just a starting point. */
export const OFFLINE_TIPS: OfflineTip[] = [
  {
    category: "nutrient_deficiency",
    label: "Yellowing or pale leaves",
    hint: "Older leaves yellowing first, overall pale or stunted growth.",
    fix: "Work in compost or well-rotted manure around the base. For a faster fix, a diluted seaweed or manure tea every couple of weeks helps most nutrient gaps.",
  },
  {
    category: "pest_damage",
    label: "Holes, chew marks, or visible insects",
    hint: "Ragged holes in leaves, sticky residue, or bugs on the underside of leaves.",
    fix: "Rinse leaves with a strong water spray to knock off small pests. A neem oil spray, applied in the evening, controls most common garden pests within a week.",
  },
  {
    category: "disease",
    label: "Spots, mold, or discoloration",
    hint: "Brown or black spots, white powdery patches, or wilting despite moist soil.",
    fix: "Remove and destroy affected leaves so it doesn't spread. Improve airflow around the plant, and avoid watering the leaves directly, water at the base instead.",
  },
  {
    category: "water_stress",
    label: "Wilting, crispy edges, or soggy soil",
    hint: "Drooping leaves, brown crispy leaf edges, or soil that's constantly wet.",
    fix: "Check soil moisture with a finger 5cm down. If dry, water deeply and less often. If soggy, let it dry out and improve drainage before watering again.",
  },
];
