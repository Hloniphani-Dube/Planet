import { useEffect, useState } from "react";
import { db as localDb } from "../lib/db";
import { STOCK_IMAGES } from "../lib/images";
import { downloadIcs } from "../lib/ics";
import type { CareCalendarEntry } from "../lib/types";

const taskLabels: Record<CareCalendarEntry["task"], string> = {
  water: "Water",
  fertilize: "Fertilize",
  prune: "Prune",
};

export function CareCalendarPage() {
  const [entries, setEntries] = useState<CareCalendarEntry[]>([]);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const all = await localDb.careEntries.orderBy("dueAt").toArray();
    setEntries(all);
  }

  async function toggleDone(entry: CareCalendarEntry) {
    await localDb.careEntries.update(entry.id, { done: !entry.done });
    void refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <img
        src={STOCK_IMAGES.careCalendar}
        alt=""
        className="grayscale-photo mb-6 h-32 w-full rounded-2xl object-cover"
      />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-black">Care calendar</h1>
          <p className="text-sm text-neutral-500">
            Reminders generated from your diagnosed plants. Runs entirely on this device.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => downloadIcs(entries)}
            className="whitespace-nowrap rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
          >
            Export .ics
          </button>
        )}
      </div>

      {entries.length === 0 && (
        <p className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-700">
          No reminders yet. Diagnose a plant to start building a care schedule.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <div className="text-sm font-medium text-black">
                {taskLabels[entry.task]} · {entry.plantName}
              </div>
              <div className="text-xs text-neutral-500">
                {new Date(entry.dueAt).toLocaleDateString()}
              </div>
            </div>
            <input
              type="checkbox"
              checked={entry.done}
              onChange={() => toggleDone(entry)}
              className="h-5 w-5 accent-black"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
