import { db } from "./db";
import type { CareCalendarEntry, CareProfile, CareTaskType, Diagnosis } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Follow-ups made from a diagnosis repeat a few times, then stop rather than nag forever. */
const DIAGNOSIS_REPEAT_LIMIT = 3;

/** 9:00 local time, `daysFromNow` days out. Reminders are for a day, not a minute. */
export function atNineAm(daysFromNow: number, from: Date = new Date()): number {
  const date = new Date(from);
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(9, 0, 0, 0);
  return date.getTime();
}

/** Local calendar date as YYYY-MM-DD, the same shape the forecast uses. */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export interface PlantTarget {
  plantId?: string;
  plantName: string;
}

export function sameTarget(entry: PlantTarget, target: PlantTarget): boolean {
  if (entry.plantId && target.plantId) return entry.plantId === target.plantId;
  return entry.plantName.trim().toLowerCase() === target.plantName.trim().toLowerCase();
}

export type DueState =
  | { kind: "overdue"; days: number }
  | { kind: "today" }
  | { kind: "upcoming"; days: number };

export function dueState(entry: CareCalendarEntry, now: number = Date.now()): DueState {
  const days = Math.round(
    (new Date(dayKey(entry.dueAt)).getTime() - new Date(dayKey(now)).getTime()) / DAY_MS,
  );
  if (days < 0) return { kind: "overdue", days: -days };
  if (days === 0) return { kind: "today" };
  return { kind: "upcoming", days };
}

export function describeDue(entry: CareCalendarEntry, now: number = Date.now()): string {
  const state = dueState(entry, now);
  if (state.kind === "today") return "Today";
  if (state.kind === "overdue") return state.days === 1 ? "1 day overdue" : `${state.days} days overdue`;
  if (state.days === 1) return "Tomorrow";
  if (state.days < 7) return `In ${state.days} days`;
  return new Date(entry.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ScheduleInput {
  reportId: string;
  photoUrl?: string;
  target: PlantTarget;
  diagnosis: Diagnosis;
  profile: CareProfile;
}

/** Turns a diagnosis into real reminders: a task, a due date, and the report and photo
 * that explain why. Replaces the still-open reminders from this plant's previous scan, so
 * the calendar reflects the latest diagnosis instead of piling up stale ones. */
export async function scheduleFromDiagnosis(input: ScheduleInput): Promise<CareCalendarEntry[]> {
  const { reportId, photoUrl, target, diagnosis, profile } = input;

  const created: CareCalendarEntry[] = [];
  const seen = new Set<CareTaskType>();
  for (const task of diagnosis.careTasks) {
    // One reminder per task type keeps the calendar readable.
    if (seen.has(task.task)) continue;
    seen.add(task.task);

    // A one-off "water now" should still lead into the plant's normal watering rhythm.
    const repeatEvery =
      task.task === "water" && task.repeatEveryDays === 0 ? profile.waterEveryDays : task.repeatEveryDays;
    const repeats = repeatEvery > 0;
    created.push({
      id: crypto.randomUUID(),
      plantReportId: reportId,
      plantId: target.plantId,
      plantName: target.plantName,
      task: task.task,
      dueAt: atNineAm(task.inDays),
      done: false,
      note: task.note || undefined,
      photoUrl,
      repeatEveryDays: repeats ? repeatEvery : undefined,
      repeatsLeft: repeats && task.task !== "water" ? DIAGNOSIS_REPEAT_LIMIT : undefined,
      origin: "diagnosis",
    });
  }

  await db.transaction("rw", db.careEntries, async () => {
    const open = await db.careEntries.filter((entry) => !entry.done).toArray();
    const stale = open
      .filter((entry) => entry.origin === "diagnosis" && sameTarget(entry, target))
      .map((entry) => entry.id);
    await db.careEntries.bulkDelete(stale);
    await db.careEntries.bulkAdd(created);
  });

  const withWatering = await ensureWateringSchedule(target, profile, { reportId, photoUrl });
  return withWatering ? [...created, withWatering] : created;
}

/** Recurring watering from the care profile, unless a watering reminder is already open. */
export async function ensureWateringSchedule(
  target: PlantTarget,
  profile: CareProfile,
  source: { reportId?: string; photoUrl?: string } = {},
): Promise<CareCalendarEntry | undefined> {
  const open = await db.careEntries.filter((entry) => !entry.done).toArray();
  if (open.some((entry) => entry.task === "water" && sameTarget(entry, target))) return undefined;

  const entry: CareCalendarEntry = {
    id: crypto.randomUUID(),
    plantReportId: source.reportId ?? "",
    plantId: target.plantId,
    plantName: target.plantName,
    task: "water",
    dueAt: atNineAm(profile.waterEveryDays),
    done: false,
    note: `Regular watering: about every ${profile.waterEveryDays} day${profile.waterEveryDays === 1 ? "" : "s"}`,
    photoUrl: source.photoUrl,
    repeatEveryDays: profile.waterEveryDays,
    origin: "profile",
  };
  await db.careEntries.add(entry);
  return entry;
}

/** Marks a reminder done and, if it recurs, creates the next one automatically. */
export async function completeEntry(entry: CareCalendarEntry): Promise<CareCalendarEntry | undefined> {
  const doneAt = Date.now();
  let next: CareCalendarEntry | undefined;

  const repeats =
    entry.repeatEveryDays !== undefined &&
    entry.repeatEveryDays > 0 &&
    (entry.repeatsLeft === undefined || entry.repeatsLeft > 0);

  if (repeats) {
    next = {
      ...entry,
      id: crypto.randomUUID(),
      dueAt: atNineAm(entry.repeatEveryDays!),
      done: false,
      doneAt: undefined,
      repeatsLeft: entry.repeatsLeft === undefined ? undefined : entry.repeatsLeft - 1,
      chainedFrom: entry.id,
    };
  }

  await db.transaction("rw", db.careEntries, async () => {
    await db.careEntries.update(entry.id, { done: true, doneAt });
    if (next) await db.careEntries.add(next);
  });
  return next;
}

/** Undoes a completion, and the follow-up it created, if that hasn't been done yet. */
export async function uncompleteEntry(entry: CareCalendarEntry): Promise<void> {
  await db.transaction("rw", db.careEntries, async () => {
    await db.careEntries.update(entry.id, { done: false, doneAt: undefined });
    const chained = await db.careEntries.filter((c) => c.chainedFrom === entry.id && !c.done).toArray();
    await db.careEntries.bulkDelete(chained.map((c) => c.id));
  });
}

export async function removeEntry(id: string): Promise<void> {
  await db.careEntries.delete(id);
}

export async function addManualEntry(input: {
  target: PlantTarget;
  task: CareTaskType;
  inDays: number;
  repeatEveryDays?: number;
  note?: string;
}): Promise<CareCalendarEntry> {
  const entry: CareCalendarEntry = {
    id: crypto.randomUUID(),
    plantReportId: "",
    plantId: input.target.plantId,
    plantName: input.target.plantName,
    task: input.task,
    dueAt: atNineAm(input.inDays),
    done: false,
    note: input.note || undefined,
    repeatEveryDays: input.repeatEveryDays && input.repeatEveryDays > 0 ? input.repeatEveryDays : undefined,
    origin: "manual",
  };
  await db.careEntries.add(entry);
  return entry;
}

export const TASK_LABELS: Record<CareTaskType, string> = {
  water: "Water",
  fertilize: "Fertilize",
  prune: "Prune",
  check: "Check again",
  treat: "Treat",
};
