import { Link } from "react-router-dom";
import { healthDotColor } from "../lib/health";
import { severityBand } from "../lib/diagnosis";
import type { HealthStatus } from "../lib/types";

export interface TimelineEntry {
  id: string;
  date: number;
  healthStatus: HealthStatus;
  summary: string;
  severity?: number;
  photoUrl?: string;
  /** Where tapping the entry goes, e.g. the full report. */
  href?: string;
}

const SEVERITY_BADGE = {
  good: "bg-green-100 text-green-800",
  watch: "bg-amber-100 text-amber-800",
  bad: "bg-red-100 text-red-700",
} as const;

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-500">No observations yet.</p>;
  }

  return (
    <ol className="flex flex-col">
      {entries.map((entry, i) => {
        const body = (
          <div className="flex gap-3 pb-5">
            {entry.photoUrl && (
              <img
                src={entry.photoUrl}
                alt=""
                loading="lazy"
                className="size-14 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                {new Date(entry.date).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                {entry.severity !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${SEVERITY_BADGE[severityBand(entry.severity).tone]}`}
                  >
                    Severity {entry.severity}
                  </span>
                )}
              </p>
              <p className="text-sm text-black">{entry.summary}</p>
            </div>
          </div>
        );

        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${healthDotColor[entry.healthStatus]}`}
                aria-hidden
              />
              {i < entries.length - 1 && <span className="w-px flex-1 bg-neutral-200" />}
            </div>
            {entry.href ? (
              <Link to={entry.href} className="min-w-0 flex-1 rounded-lg transition-colors hover:bg-neutral-50">
                {body}
              </Link>
            ) : (
              <div className="min-w-0 flex-1">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
