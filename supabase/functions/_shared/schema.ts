// Keep this file identical to src/lib/diagnosisSchema.ts: the browser (demo mode) and the Edge
// Functions (full platform) must ask the AI for exactly the same shape.
export const DIAGNOSIS_CATEGORIES = [
  "nutrient_deficiency",
  "pest_damage",
  "disease",
  "water_stress",
  "healthy",
  "unknown",
] as const;

export const HEALTH_STATUSES = ["healthy", "needs_attention", "critical", "unknown"] as const;
export const URGENCY_LEVELS = ["low", "medium", "high"] as const;
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export const LIGHT_NEEDS = ["low", "medium", "bright", "full_sun"] as const;
export const CARE_TASK_TYPES = ["water", "fertilize", "prune", "check", "treat"] as const;

export const SYSTEM_PROMPT =
  "You are Planet-i-Green, a plant health companion for anyone with a plant: home " +
  "gardeners, students, first-time plant owners, and farmers alike. You may be given " +
  "more than one photo of the same plant, taken from different angles (leaf top, leaf " +
  "underside, stem, soil). Look across all of them together. Answer three questions: " +
  "what is happening, what should the person do now, and what should they check next. " +
  "Never present a diagnosis from a photo as a guaranteed fact. Use cautious, honest " +
  "language: 'observed' for something visibly present in the image, 'possible' for a " +
  "plausible explanation, 'likely' when the evidence points toward one explanation over " +
  "others, and say plainly when a photo alone cannot determine the cause. List possible " +
  "causes most-likely-first. Always recommend low-cost, locally available fixes " +
  "(compost, neem oil, spacing, watering adjustments) rather than branded or expensive " +
  "products. If local weather conditions are given, factor them into the diagnosis and " +
  "the recommended actions, for example adjusting watering advice for humidity or " +
  "flagging frost risk. State a brief, honest limitation when the photo alone can't " +
  "confirm something (e.g. a photo can't confirm a pest is still active, or can't rule " +
  "out a second cause). " +
  "Score severity from 0 to 10 as a whole number: 0 means no visible problem, 1-3 mild, " +
  "4-6 moderate, 7-8 serious, 9-10 the plant is likely to die without quick action. " +
  "Say how sure you are of the plant's identity separately from how sure you are of the " +
  "diagnosis, and give the scientific name only if you are reasonably confident. Give " +
  "exactly one companion-planting tip that is specific to this plant, and one native or " +
  "pollinator-friendly plant worth adding or swapping in. If a location or region is " +
  "given, prefer something that genuinely grows there; if not, suggest a widely suitable " +
  "pollinator-friendly plant and don't claim it is native anywhere in particular. " +
  "Provide a care profile for the identified plant: its light need, how many days " +
  "between waterings in normal conditions, the lowest and highest temperatures in " +
  "Celsius it tolerates, and whether frost damages it. Finally list 2 to 4 concrete " +
  "care tasks with the number of days from now to do each, always including one 'check' " +
  "task for the follow-up; use repeatEveryDays only for tasks that genuinely recur, " +
  "otherwise 0. Respond only by calling record_diagnosis with your findings.";

export function buildUserPrompt(imageCount: number, weatherContext?: string, userNotes?: string): string {
  const parts: string[] = [];
  parts.push(
    imageCount > 1 ? `Diagnose this plant from these ${imageCount} photos.` : "Diagnose this plant.",
  );
  if (weatherContext) {
    parts.push(`Local conditions right now: ${weatherContext}.`);
  }
  if (userNotes) {
    parts.push(`What the person has told us: ${userNotes}`);
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
    scientificName: {
      type: "string",
      description: "Scientific name if you are reasonably confident, otherwise an empty string.",
    },
    identificationConfidence: {
      type: "string",
      enum: CONFIDENCE_LEVELS,
      description: "How sure you are of which plant this is (separate from the diagnosis).",
    },
    category: {
      type: "string",
      enum: DIAGNOSIS_CATEGORIES,
    },
    summary: {
      type: "string",
      description:
        "Plain-language explanation of what's visible in the photo (this is 'what Planet-i-Green sees'). One or two sentences.",
    },
    fix: {
      type: "string",
      description:
        "The single clearest, low-cost, locally actionable fix (compost, neem oil, spacing, watering changes). Avoid recommending branded or expensive products.",
    },
    confidence: { type: "string", enum: CONFIDENCE_LEVELS },
    healthStatus: {
      type: "string",
      enum: HEALTH_STATUSES,
      description: "Overall assessment of the plant's current condition.",
    },
    severityScore: {
      type: "integer",
      description:
        "0 = no visible problem, 1-3 mild, 4-6 moderate, 7-8 serious, 9-10 likely to die without quick action.",
    },
    possibleCauses: {
      type: "array",
      items: { type: "string" },
      description:
        "1 to 3 possible causes, most likely first, phrased cautiously ('possible', 'likely'), never as certainty.",
    },
    recommendedActions: {
      type: "array",
      items: { type: "string" },
      description: "2 to 4 concrete, ordered, low-cost actions the person can take right now.",
    },
    urgency: {
      type: "string",
      enum: URGENCY_LEVELS,
      description: "How soon the person should act.",
    },
    followUpDays: {
      type: "integer",
      description: "Recommended number of days until the plant should be checked again.",
    },
    limitations: {
      type: "string",
      description:
        "A brief, honest caveat about what can't be determined from a photo alone, if applicable. Empty string if none.",
    },
    companionTip: {
      type: "string",
      description:
        "One companion-planting tip specific to this plant (what to grow beside it and why). One sentence.",
    },
    nativeAlternative: {
      type: "string",
      description:
        "One native or pollinator-friendly plant to add or swap in, and why. One sentence. Empty string if nothing suitable.",
    },
    careProfile: {
      type: "object",
      description: "What this plant needs in normal conditions.",
      properties: {
        light: { type: "string", enum: LIGHT_NEEDS },
        waterEveryDays: {
          type: "integer",
          description: "Typical days between waterings in normal conditions.",
        },
        minTempC: { type: "number", description: "Lowest temperature in Celsius it tolerates." },
        maxTempC: { type: "number", description: "Highest temperature in Celsius it tolerates." },
        frostSensitive: {
          type: "boolean",
          description: "True if frost damages or kills this plant.",
        },
      },
      required: ["light", "waterEveryDays", "minTempC", "maxTempC", "frostSensitive"],
    },
    careTasks: {
      type: "array",
      description: "2 to 4 care tasks, always including one 'check' follow-up.",
      items: {
        type: "object",
        properties: {
          task: { type: "string", enum: CARE_TASK_TYPES },
          inDays: { type: "integer", description: "Days from now. 0 means today." },
          note: { type: "string", description: "What to do and why, in a few words." },
          repeatEveryDays: {
            type: "integer",
            description: "0 for a one-off, otherwise how many days after completion to repeat.",
          },
        },
        required: ["task", "inDays", "note", "repeatEveryDays"],
      },
    },
  },
  required: [
    "plantName",
    "scientificName",
    "identificationConfidence",
    "category",
    "summary",
    "fix",
    "confidence",
    "healthStatus",
    "severityScore",
    "possibleCauses",
    "recommendedActions",
    "urgency",
    "followUpDays",
    "limitations",
    "companionTip",
    "nativeAlternative",
    "careProfile",
    "careTasks",
  ],
} as const;

/** Converts the JSON Schema above into Gemini's response-schema dialect, so the schema is
 * defined once. Gemini wants upper-case type names and `format: "enum"` on string enums. */
export function toGeminiSchema(node: Record<string, unknown>): Record<string, unknown> {
  const type = String(node.type).toUpperCase();
  const out: Record<string, unknown> = { type };
  if (typeof node.description === "string") out.description = node.description;
  if (Array.isArray(node.enum)) {
    out.format = "enum";
    out.enum = [...node.enum];
  }
  if (node.properties && typeof node.properties === "object") {
    out.properties = Object.fromEntries(
      Object.entries(node.properties as Record<string, Record<string, unknown>>).map(([key, value]) => [
        key,
        toGeminiSchema(value),
      ]),
    );
  }
  if (Array.isArray(node.required)) out.required = [...node.required];
  if (node.items) out.items = toGeminiSchema(node.items as Record<string, unknown>);
  return out;
}
