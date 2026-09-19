import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Bug,
  X,
  Check,
  Droplets,
  Eye,
  FileDown,
  Plus,
  Repeat,
  Scissors,
  Sprout,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { ForecastStrip } from "../components/ForecastStrip";
import { ALERT_ICONS } from "../components/WeatherBanner";
import { useLiveQuery } from "../hooks/useLiveQuery";
import { useMyPlants } from "../hooks/useMyPlants";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import {
  addManualEntry,
  completeEntry,
  describeDue,
  dueState,
  removeEntry,
  TASK_LABELS,
  uncompleteEntry,
} from "../lib/careTasks";
import { db } from "../lib/db";
import { downloadIcs } from "../lib/ics";
import { alertsForEntry, entryWeatherNote, type WeatherAlert } from "../lib/weatherAlerts";
import type { CareCalendarEntry, CareTaskType } from "../lib/types";

const TASK_ICONS: Record<CareTaskType, LucideIcon> = {
  water: Droplets,
  fertilize: Sprout,
  prune: Scissors,
  check: Eye,
  treat: Bug,
};

const loadEntries = () => db.careEntries.orderBy("dueAt").toArray();

interface Toast {
  text: string;
  undo?: CareCalendarEntry;
  scanPlant?: { name: string; id?: string };
}

function EntryRow({
  entry,
  alerts,
  onToggle,
  onRemove,
}: {
  entry: CareCalendarEntry;
  alerts: WeatherAlert[];
  onToggle: (entry: CareCalendarEntry) => void;
  onRemove: (entry: CareCalendarEntry) => void;
}) {
  const Icon = TASK_ICONS[entry.task];
  const state = dueState(entry);
  const weatherNote = entry.done ? null : entryWeatherNote(entry, alertsForEntry(entry, alerts));

  const badge = entry.done
    ? "bg-neutral-100 text-neutral-500"
    : state.kind === "overdue"
      ? "bg-red-100 text-red-700"
      : state.kind === "today"
        ? "bg-green-100 text-green-800"
        : "bg-neutral-100 text-neutral-600";

  const thumb = entry.photoUrl ? (
    <img src={entry.photoUrl} alt="" loading="lazy" className="size-11 shrink-0 rounded-xl object-cover" />
  ) : (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
      <Icon size={20} aria-hidden />
    </span>
  );

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm ${
        entry.done ? "opacity-60" : ""
      }`}
    >
      {entry.plantReportId ? (
        <Link to={`/report/${entry.plantReportId}`} aria-label="See the report this came from">
          {thumb}
        </Link>
      ) : (
        thumb
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-sm font-medium text-black ${entry.done ? "line-through" : ""}`}>
            {TASK_LABELS[entry.task]} · {entry.plantName}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}>
            {entry.done ? "Done" : describeDue(entry)}
          </span>
        </div>
        {entry.note && <p className="mt-0.5 text-xs text-neutral-600">{entry.note}</p>}
        {entry.repeatEveryDays && !entry.done && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-400">
            <Repeat size={11} aria-hidden />
            Repeats every {entry.repeatEveryDays} day{entry.repeatEveryDays === 1 ? "" : "s"} once done
          </p>
        )}
        {weatherNote && (
          <p className="mt-1.5 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">
            {weatherNote}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={entry.done}
          aria-label={entry.done ? "Mark as not done" : "Mark as done"}
          onClick={() => onToggle(entry)}
          className={`flex size-8 items-center justify-center rounded-full border-2 transition-colors ${
            entry.done
              ? "border-green-700 bg-green-700 text-white"
              : "border-neutral-300 text-transparent hover:border-green-700 hover:text-green-700"
          }`}
        >
          <Check size={16} strokeWidth={3} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onRemove(entry)}
          aria-label="Delete reminder"
          className="text-neutral-300 transition-colors hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function Group({
  title,
  entries,
  alerts,
  onToggle,
  onRemove,
}: {
  title: string;
  entries: CareCalendarEntry[];
  alerts: WeatherAlert[];
  onToggle: (entry: CareCalendarEntry) => void;
  onRemove: (entry: CareCalendarEntry) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} alerts={alerts} onToggle={onToggle} onRemove={onRemove} />
        ))}
      </ul>
    </section>
  );
}

function AddReminderForm({
  plantNames,
  onDone,
}: {
  plantNames: { id?: string; name: string }[];
  onDone: (message: string) => void;
}) {
  const [plant, setPlant] = useState(plantNames[0]?.name ?? "");
  const [task, setTask] = useState<CareTaskType>("water");
  const [inDays, setInDays] = useState(1);
  const [repeat, setRepeat] = useState(0);
  const [note, setNote] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!plant.trim()) return;
    const match = plantNames.find((p) => p.name === plant.trim());
    await addManualEntry({
      target: { plantId: match?.id, plantName: plant.trim() },
      task,
      inDays,
      repeatEveryDays: repeat,
      note: note.trim(),
    });
    onDone("Reminder added");
  }

  const field = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black";
  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4">
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        Plant
        <input
          list="calendar-plants"
          value={plant}
          onChange={(e) => setPlant(e.target.value)}
          placeholder="e.g. Tomato"
          className={field}
          required
        />
        <datalist id="calendar-plants">
          {plantNames.map((p) => (
            <option key={p.id ?? p.name} value={p.name} />
          ))}
        </datalist>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-3 flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-1">
          Task
          <select value={task} onChange={(e) => setTask(e.target.value as CareTaskType)} className={field}>
            {(Object.keys(TASK_LABELS) as CareTaskType[]).map((t) => (
              <option key={t} value={t}>
                {TASK_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-3 flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-1">
          In how many days
          <input type="number" min={0} max={365} value={inDays} onChange={(e) => setInDays(Number(e.target.value))} className={field} />
        </label>
        <label className="col-span-3 flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-1">
          Repeat every (days, 0 = once)
          <input type="number" min={0} max={365} value={repeat} onChange={(e) => setRepeat(Number(e.target.value))} className={field} />
        </label>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className={field}
      />
      <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
        Add reminder
      </button>
    </form>
  );
}

export function CareCalendarPage() {
  const entries = useLiveQuery(loadEntries);
  const { plants } = useMyPlants();
  const { location, forecast, alerts } = useWeatherAlerts(plants);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  const groups = useMemo(() => {
    const open = (entries ?? []).filter((e) => !e.done);
    const done = (entries ?? []).filter((e) => e.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
    return {
      overdue: open.filter((e) => dueState(e).kind === "overdue"),
      today: open.filter((e) => dueState(e).kind === "today"),
      week: open.filter((e) => {
        const s = dueState(e);
        return s.kind === "upcoming" && s.days <= 7;
      }),
      later: open.filter((e) => {
        const s = dueState(e);
        return s.kind === "upcoming" && s.days > 7;
      }),
      done: done.slice(0, 10),
    };
  }, [entries]);

  const knownPlants = useMemo(() => {
    const byName = new Map<string, { id?: string; name: string }>();
    (plants ?? []).forEach((p) => byName.set(p.name.toLowerCase(), { id: p.id, name: p.name }));
    (entries ?? []).forEach((e) => {
      if (!byName.has(e.plantName.toLowerCase())) byName.set(e.plantName.toLowerCase(), { id: e.plantId, name: e.plantName });
    });
    return [...byName.values()];
  }, [plants, entries]);

  async function toggle(entry: CareCalendarEntry) {
    if (entry.done) {
      await uncompleteEntry(entry);
      setToast(null);
      return;
    }
    const next = await completeEntry(entry);
    setToast({
      text: next
        ? `Done. Next ${TASK_LABELS[next.task].toLowerCase()} reminder ${describeDue(next).toLowerCase()}.`
        : "Done.",
      undo: entry,
      scanPlant: entry.task === "check" ? { name: entry.plantName, id: entry.plantId } : undefined,
    });
  }

  async function remove(entry: CareCalendarEntry) {
    await removeEntry(entry.id);
    setToast(null);
  }

  const hasEntries = (entries ?? []).length > 0;
  const upcomingAlerts = alerts.filter((a) => a.dayOffset <= 6);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-black">Care calendar</h1>
          <p className="text-sm text-neutral-500">
            Reminders built from your scans, kept on this device.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-label="Add a reminder"
            className="flex size-9 items-center justify-center rounded-full bg-black text-white"
          >
            <Plus size={18} />
          </button>
          {hasEntries && (
            <button
              type="button"
              onClick={() => downloadIcs(entries ?? [])}
              aria-label="Export to calendar (.ics)"
              title="Export .ics"
              className="flex size-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:border-black hover:text-black"
            >
              <FileDown size={16} />
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <AddReminderForm
          plantNames={knownPlants}
          onDone={(text) => {
            setShowForm(false);
            setToast({ text });
          }}
        />
      )}

      {/* Weather: the week ahead, and what it means for your plants. */}
      {location && forecast ? (
        <section className="mt-4" aria-label="Weather for your plants">
          <ForecastStrip forecast={forecast} alerts={alerts} />
          {upcomingAlerts.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {upcomingAlerts.slice(0, 6).map((alert) => {
                const Icon = ALERT_ICONS[alert.kind];
                const warning = alert.level === "warning";
                return (
                  <li
                    key={alert.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      warning ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${warning ? "text-red-700" : "text-amber-700"}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black">{alert.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-600">{alert.advice}</p>
                      <p className="mt-1 text-xs text-neutral-500">{alert.plants.map((p) => p.name).join(", ")}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {upcomingAlerts.length === 0 && (plants ?? []).length > 0 && (
            <p className="mt-2 text-xs text-neutral-500">No frost, heat or heavy-rain risks this week for your plants.</p>
          )}
        </section>
      ) : (
        <p className="mt-4 rounded-xl bg-neutral-100 p-3 text-xs text-neutral-600">
          Add your location to see the week's forecast here, with frost, heat and rain flagged against
          your plants.{" "}
          <Link to="/settings#location" className="font-semibold text-black underline">
            Set location
          </Link>
        </p>
      )}

      {entries !== undefined && !hasEntries && (
        <div className="mt-6 rounded-2xl bg-neutral-100 p-6 text-center">
          <p className="text-sm font-semibold text-black">No reminders yet</p>
          <p className="mt-1 text-sm text-neutral-600">
            Scan a plant and its follow-ups, watering rhythm and treatments appear here automatically.
          </p>
          <Link to="/" className="mt-4 inline-block rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
            Scan a plant
          </Link>
        </div>
      )}

      <Group title="Overdue" entries={groups.overdue} alerts={alerts} onToggle={toggle} onRemove={remove} />
      <Group title="Today" entries={groups.today} alerts={alerts} onToggle={toggle} onRemove={remove} />
      <Group title="Next 7 days" entries={groups.week} alerts={alerts} onToggle={toggle} onRemove={remove} />
      <Group title="Later" entries={groups.later} alerts={alerts} onToggle={toggle} onRemove={remove} />
      <Group title="Recently done" entries={groups.done} alerts={alerts} onToggle={toggle} onRemove={remove} />

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-black px-4 py-3 text-sm text-white shadow-xl md:bottom-6"
        >
          <span className="flex-1">
            {toast.text}
            {toast.scanPlant && (
              <>
                {" "}
                <Link
                  to={toast.scanPlant.id ? `/?plant=${toast.scanPlant.id}` : "/"}
                  className="font-semibold underline"
                >
                  Scan it again
                </Link>
              </>
            )}
          </span>
          {toast.undo && (
            <button
              type="button"
              onClick={async () => {
                await uncompleteEntry(toast.undo!);
                setToast(null);
              }}
              className="flex items-center gap-1 font-semibold underline"
            >
              <Undo2 size={14} aria-hidden />
              Undo
            </button>
          )}
          <button type="button" onClick={() => setToast(null)} className="opacity-70" aria-label="Dismiss">
            <X size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
