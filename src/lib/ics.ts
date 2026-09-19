import { TASK_LABELS } from "./careTasks";
import type { CareCalendarEntry } from "./types";

function toIcsDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets must be folded per RFC 5545, or strict calendar apps reject them. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  for (let i = 0; i < line.length; i += 73) chunks.push(line.slice(i, i + 73));
  return chunks.join("\r\n ");
}

/** Builds a standard iCalendar file. Importable into Google Calendar, Apple Calendar,
 * Outlook, or anything else that reads .ics, no account linking or OAuth needed.
 * Recurring reminders carry an RRULE, and every event has a popup alarm at its start. */
export function buildIcs(entries: CareCalendarEntry[], origin = window.location.origin): string {
  const now = toIcsDate(Date.now());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Planet-i-Green//Care Calendar//EN"];

  for (const entry of entries) {
    const title = `${TASK_LABELS[entry.task]}: ${entry.plantName}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${entry.id}@planet-i-green.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(entry.dueAt)}`,
      `DTEND:${toIcsDate(entry.dueAt + 30 * 60 * 1000)}`,
      fold(`SUMMARY:${escapeIcsText(title)}`),
    );
    if (entry.note) lines.push(fold(`DESCRIPTION:${escapeIcsText(entry.note)}`));
    if (entry.plantReportId) lines.push(fold(`URL:${origin}/report/${entry.plantReportId}`));
    if (entry.repeatEveryDays && !entry.done) {
      const count = entry.repeatsLeft === undefined ? 26 : entry.repeatsLeft + 1;
      lines.push(`RRULE:FREQ=DAILY;INTERVAL=${entry.repeatEveryDays};COUNT=${count}`);
    }
    lines.push(
      `STATUS:${entry.done ? "CONFIRMED" : "TENTATIVE"}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:${escapeIcsText(title)}`),
      "TRIGGER:PT0S",
      "END:VALARM",
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
