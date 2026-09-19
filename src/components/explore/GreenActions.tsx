import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { useLiveQuery } from "../../hooks/useLiveQuery";
import { db } from "../../lib/db";
import { GREEN_ACTIONS, impactLevel, toggleActionDone, type GreenAction } from "../../lib/greenActions";
import { getCatalogPlant } from "../../lib/plantCatalog";
import { Disclosure } from "../Disclosure";

const loadActionLog = () => db.actionLog.toArray();

/** One quiet line of progress. Only counts what the app can really count. */
function Progress({ done }: { done: number }) {
  const level = impactLevel(done);
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-black">{level.name}</span>
        <span className="text-xs text-neutral-500">
          {done} of {GREEN_ACTIONS.length} done
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-green-600 transition-all"
          style={{ width: `${(done / GREEN_ACTIONS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ActionRow({
  action,
  done,
  open,
  onToggleOpen,
}: {
  action: GreenAction;
  done: boolean;
  open: boolean;
  onToggleOpen: () => void;
}) {
  const Icon = action.icon;
  const suggested = action.plants.map(getCatalogPlant).filter((p) => p !== undefined).slice(0, 4);

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            done ? "bg-green-700 text-white" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {done ? <Check size={20} aria-hidden /> : <Icon size={20} strokeWidth={1.8} aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-black">{action.title}</span>
          <span className="block text-xs text-neutral-500">
            {action.effort} · {action.cost}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-300 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-neutral-200 px-4 pb-4 pt-3">
          <ol className="flex flex-col gap-2">
            {action.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-neutral-700">
                <span className="w-4 shrink-0 text-xs text-neutral-400">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-2">
            <Disclosure title="Why it helps">{action.why}</Disclosure>
          </div>

          {suggested.length > 0 && (
            <p className="mb-3 text-xs text-neutral-500">
              Try:{" "}
              {suggested.map((plant, i) => (
                <span key={plant.slug}>
                  {i > 0 && ", "}
                  <Link to={`/explore/plants/${plant.slug}`} className="text-black underline">
                    {plant.name}
                  </Link>
                </span>
              ))}
            </p>
          )}

          <button
            type="button"
            onClick={() => void toggleActionDone(action.id)}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              done ? "border border-neutral-300 text-neutral-700 hover:border-black" : "bg-black text-white"
            }`}
          >
            {done ? "Mark as not done" : "I did this"}
          </button>
        </div>
      )}
    </li>
  );
}

export function GreenActions() {
  const log = useLiveQuery(loadActionLog);
  const [openId, setOpenId] = useState<string | null>(null);
  const doneIds = useMemo(() => new Set((log ?? []).map((entry) => entry.actionId)), [log]);

  return (
    <div>
      <Progress done={doneIds.size} />
      <ul className="flex flex-col gap-2">
        {GREEN_ACTIONS.map((action) => (
          <ActionRow
            key={action.id}
            action={action}
            done={doneIds.has(action.id)}
            open={openId === action.id}
            onToggleOpen={() => setOpenId(openId === action.id ? null : action.id)}
          />
        ))}
      </ul>
    </div>
  );
}
