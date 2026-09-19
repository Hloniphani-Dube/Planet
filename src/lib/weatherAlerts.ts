import { dayKey } from "./careTasks";
import { DEFAULT_CARE_PROFILE } from "./plantCatalog";
import type { DayForecast, Forecast } from "./weather";
import type { CareCalendarEntry, CareProfile, Plant } from "./types";

export type AlertKind = "frost" | "cold" | "heat" | "heavy_rain";
export type AlertLevel = "watch" | "warning";

export interface AlertPlant {
  id: string;
  name: string;
}

export interface WeatherAlert {
  id: string;
  kind: AlertKind;
  level: AlertLevel;
  /** Days from today: 0 is today (or tonight, for frost and cold). */
  dayOffset: number;
  date: string;
  title: string;
  advice: string;
  plants: AlertPlant[];
}

const ADVICE: Record<AlertKind, string> = {
  frost:
    "Move pots indoors or into shelter, or cover beds with an old sheet or fleece before dusk. Watering the soil in the afternoon helps it hold warmth overnight.",
  cold: "Move tender pots to a sheltered spot against a wall, or bring them inside for the night.",
  heat: "Water early in the morning, add a layer of mulch, and shade plants from the afternoon sun.",
  heavy_rain:
    "You can skip watering. Check that pots and beds drain freely, and move pots out of standing water.",
};

/** Rain that counts as heavy for a garden, in millimetres per day. */
const HEAVY_RAIN_MM = 15;
const SEVERE_RAIN_MM = 30;

function whenLabel(dayOffset: number, kind: AlertKind): string {
  const overnight = kind === "frost" || kind === "cold";
  if (dayOffset === 0) return overnight ? "tonight" : "today";
  if (dayOffset === 1) return overnight ? "tomorrow night" : "tomorrow";
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  return overnight ? `${weekday} night` : `on ${weekday}`;
}

interface Hit {
  kind: AlertKind;
  level: AlertLevel;
}

function checkDay(profile: CareProfile, day: DayForecast, hardinessKnown: boolean): Hit[] {
  const hits: Hit[] = [];
  const night = day.nightMinC;

  if (night !== null) {
    if (profile.frostSensitive && night <= 2) {
      hits.push({ kind: "frost", level: night <= 0 ? "warning" : "watch" });
    } else if (!hardinessKnown && night <= 0) {
      // Hardiness unknown: warn on a real frost, and say so in the wording.
      hits.push({ kind: "frost", level: "watch" });
    } else if (night < profile.minTempC && night <= 5) {
      hits.push({ kind: "cold", level: "watch" });
    }
  }

  const heatLine = Math.max(30, profile.maxTempC + 2);
  if (day.maxC >= heatLine) {
    hits.push({ kind: "heat", level: day.maxC >= Math.max(38, profile.maxTempC + 6) ? "warning" : "watch" });
  }

  if (day.precipMm >= HEAVY_RAIN_MM) {
    hits.push({ kind: "heavy_rain", level: day.precipMm >= SEVERE_RAIN_MM ? "warning" : "watch" });
  }
  return hits;
}

/** Works out which plants each forecast day puts at risk. Frost warnings only fire for
 * plants that are actually frost-sensitive, and indoor plants are never flagged. */
export function computeAlerts(forecast: Forecast, plants: Plant[]): WeatherAlert[] {
  const grouped = new Map<string, WeatherAlert>();

  for (const plant of plants) {
    if (plant.environment === "indoor") continue;
    const profile = plant.careProfile ?? DEFAULT_CARE_PROFILE;
    const hardinessKnown = profile.source !== "default";

    forecast.days.forEach((day, dayOffset) => {
      for (const hit of checkDay(profile, day, hardinessKnown)) {
        const id = `${hit.kind}:${day.date}`;
        const existing = grouped.get(id);
        const member: AlertPlant = { id: plant.id, name: plant.name };
        if (existing) {
          existing.plants.push(member);
          if (hit.level === "warning") existing.level = "warning";
        } else {
          grouped.set(id, {
            id,
            kind: hit.kind,
            level: hit.level,
            dayOffset,
            date: day.date,
            title: "",
            advice: ADVICE[hit.kind],
            plants: [member],
          });
        }
      }
    });
  }

  const total = plants.filter((p) => p.environment !== "indoor").length;
  const alerts = [...grouped.values()].map((alert) => ({ ...alert, title: titleFor(alert, total) }));
  return alerts.sort((a, b) => a.dayOffset - b.dayOffset || Number(b.level === "warning") - Number(a.level === "warning"));
}

function titleFor(alert: WeatherAlert, outdoorTotal: number): string {
  const n = alert.plants.length;
  const when = whenLabel(alert.dayOffset, alert.kind);
  const plural = n === 1 ? "plant" : "plants";
  const of = outdoorTotal > n ? `${n} of your ${outdoorTotal} outdoor plants` : n === 1 ? "1 of your plants" : `all ${n} of your plants`;

  switch (alert.kind) {
    case "frost":
      return alert.dayOffset <= 1
        ? `${of} ${n === 1 ? "is" : "are"} frost-sensitive. Protect ${n === 1 ? "it" : "them"} ${when}`
        : `Frost expected ${when}: ${n} ${plural} at risk`;
    case "cold":
      return `Cold ${when} for ${n} ${plural}`;
    case "heat":
      return `Hot weather ${when}: ${n} ${plural} may struggle`;
    case "heavy_rain":
      return `Heavy rain ${when}: skip watering for ${n} ${plural}`;
  }
}

/** The alerts worth a banner right now: anything in the next two days. */
export function digestAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  return alerts.filter((alert) => alert.dayOffset <= 1);
}

/** A stable signature for "today's digest", so a dismissed banner stays dismissed for the
 * day but comes back if the forecast changes. */
export function digestSignature(alerts: WeatherAlert[]): string {
  return `${dayKey(Date.now())}|${alerts.map((a) => `${a.id}:${a.plants.length}`).join(",")}`;
}

/** Weather flags for one reminder: alerts on the day it's due that affect its plant. */
export function alertsForEntry(entry: CareCalendarEntry, alerts: WeatherAlert[]): WeatherAlert[] {
  const due = dayKey(entry.dueAt);
  return alerts.filter((alert) => {
    if (alert.date !== due) return false;
    return alert.plants.some((p) =>
      entry.plantId ? p.id === entry.plantId : p.name.trim().toLowerCase() === entry.plantName.trim().toLowerCase(),
    );
  });
}

/** One line for a reminder, when the weather changes what the person should do. */
export function entryWeatherNote(entry: CareCalendarEntry, flagged: WeatherAlert[]): string | null {
  for (const alert of flagged) {
    if (alert.kind === "heavy_rain" && entry.task === "water") return "Heavy rain forecast. You can probably skip this.";
    if (alert.kind === "frost" || alert.kind === "cold") {
      const what = alert.kind === "frost" ? "Frost" : "A cold night";
      if (entry.task === "fertilize" || entry.task === "prune") return `${what} forecast. Better to wait until it passes.`;
      return `${what} forecast around this day. Protect the plant.`;
    }
    if (alert.kind === "heat" && (entry.task === "fertilize" || entry.task === "prune")) {
      return "Hot weather forecast. Better to wait for cooler days.";
    }
    if (alert.kind === "heat" && entry.task === "water") return "Hot weather forecast. Water early in the morning.";
  }
  return null;
}
