import type { CareCalendarEntry } from "./types";

const taskTitles: Record<CareCalendarEntry["task"], string> = {
  water: "Water",
  fertilize: "Fertilize",
  prune: "Prune",
};

function toIcsDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** Builds a standard iCalendar file. Importable into Google Calendar, Apple Calendar,
 * Outlook, or anything else that reads .ics, no account linking or OAuth needed. */
export function buildIcs(entries: CareCalendarEntry[]): string {
  const now = toIcsDate(Date.now());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Planet//Care Calendar//EN"];

  for (const entry of entries) {
    const title = `${taskTitles[entry.task]}: ${entry.plantName}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${entry.id}@planet.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(entry.dueAt)}`,
      `SUMMARY:${escapeIcsText(title)}`,
      `STATUS:${entry.done ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(entries: CareCalendarEntry[], filename = "care-calendar.ics"): void {
  const blob = new Blob([buildIcs(entries)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
