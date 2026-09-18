export const DIAGNOSIS_CATEGORIES = [
  "nutrient_deficiency",
  "pest_damage",
  "disease",
  "water_stress",
  "healthy",
  "unknown",
] as const;

export const SYSTEM_PROMPT =
  "You are a plant health assistant for smallholder farmers and home gardeners in " +
  "low-resource settings. You may be given more than one photo of the same plant, " +
  "taken from different angles (leaf top, leaf underside, stem, soil). Look across " +
  "all of them together and identify the plant and any nutrient deficiency, pest " +
  "damage, disease, or drought/overwater stress. If local weather conditions are " +
  "given, factor them into the diagnosis and the fix, for example adjusting watering " +
  "advice for humidity or flagging frost risk. Always recommend low-cost, locally " +
  "available fixes (compost, neem oil, spacing, watering adjustments) rather than " +
  "branded or expensive products. Respond only by calling record_diagnosis with your " +
  "findings.";

export function buildUserPrompt(imageCount: number, weatherContext?: string): string {
  const parts: string[] = [];
  parts.push(
    imageCount > 1 ? `Diagnose this plant from these ${imageCount} photos.` : "Diagnose this plant.",
  );
  if (weatherContext) {
    parts.push(`Local conditions right now: ${weatherContext}.`);
  }
  return parts.join(" ");
}

/** Plain JSON Schema shared by providers that accept a standard schema object (Claude, OpenAI). */
export const DIAGNOSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    plantName: {
      type: "string",
      description: "Common name of the plant, or 'unknown plant' if it can't be identified.",
    },
    category: {
      type: "string",
      enum: DIAGNOSIS_CATEGORIES,
    },
    summary: {
      type: "string",
      description: "One or two plain-language sentences describing what's wrong (or that it's healthy).",
    },
    fix: {
      type: "string",
      description:
        "A concrete, low-cost, locally actionable fix (compost, neem oil, spacing, watering changes). Avoid recommending branded or expensive products.",
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: ["plantName", "category", "summary", "fix", "confidence"],
} as const;
