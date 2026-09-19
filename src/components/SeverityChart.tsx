import { motion } from "framer-motion";
import { severityBand } from "../lib/diagnosis";
import { computeTrend, type SeverityPoint, type TrendTone } from "../lib/trend";

const W = 320;
const H = 160;
const PAD = { left: 30, right: 14, top: 12, bottom: 26 };

const TONE_CLASSES: Record<TrendTone, string> = {
  good: "bg-green-100 text-green-800",
  watch: "bg-amber-100 text-amber-800",
  bad: "bg-red-100 text-red-700",
  neutral: "bg-neutral-100 text-neutral-600",
};

const DOT_CLASSES = { good: "fill-green-500", watch: "fill-amber-500", bad: "fill-red-500" } as const;

export function TrendChip({ points }: { points: SeverityPoint[] }) {
  const verdict = computeTrend(points);
  return (
    <span
      title={verdict.detail}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[verdict.tone]}`}
    >
      {verdict.label}
    </span>
  );
}

/** Severity over time for one plant. Bands are shaded so a line drifting down into the
 * green area reads as "recovering" without needing to know the scale. */
export function SeverityChart({ points }: { points: SeverityPoint[] }) {
  const sorted = [...points].sort((a, b) => a.date - b.date);
  if (sorted.length === 0) return null;

  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (t: number) => (last === first ? PAD.left + innerW / 2 : PAD.left + ((t - first) / (last - first)) * innerW);
  const y = (severity: number) => PAD.top + (1 - severity / 10) * innerH;

  const path = sorted.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.date).toFixed(1)} ${y(p.severity).toFixed(1)}`).join(" ");
  const dateLabel = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const verdict = computeTrend(sorted);

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Severity over time. ${verdict.label}. ${verdict.detail}`}
      >
        {/* Bands: 0-3 mild, 3-6 moderate, 6-10 serious. */}
        <rect x={PAD.left} y={y(3)} width={innerW} height={y(0) - y(3)} className="fill-green-500 opacity-10" />
        <rect x={PAD.left} y={y(6)} width={innerW} height={y(3) - y(6)} className="fill-amber-500 opacity-10" />
        <rect x={PAD.left} y={y(10)} width={innerW} height={y(6) - y(10)} className="fill-red-500 opacity-10" />

        {[0, 5, 10].map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-neutral-300" strokeDasharray="2 4" />
            <text x={PAD.left - 6} y={y(tick) + 3.5} textAnchor="end" className="fill-neutral-500" fontSize="10">
              {tick}
            </text>
          </g>
        ))}

        {sorted.length > 1 && (
          <motion.path
            d={path}
            fill="none"
            className="stroke-black"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}

        {sorted.map((p) => (
          <circle
            key={p.id}
            cx={x(p.date)}
            cy={y(p.severity)}
            r={5}
            strokeWidth={2}
            className={`stroke-white ${DOT_CLASSES[severityBand(p.severity).tone]}`}
          >
            <title>{`${dateLabel(p.date)}: severity ${p.severity} of 10`}</title>
          </circle>
        ))}

        <text x={PAD.left} y={H - 6} className="fill-neutral-500" fontSize="10">
          {dateLabel(first)}
        </text>
        {last !== first && (
          <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-neutral-500" fontSize="10">
            {dateLabel(last)}
          </text>
        )}
      </svg>
      <figcaption className="mt-1 text-[11px] text-neutral-500">
        Severity, 0 to 10. Lower is better; a line heading into the green means it's recovering.
      </figcaption>
    </figure>
  );
}

export function SeverityMeter({ score }: { score: number }) {
  const band = severityBand(score);
  const fill = { good: "bg-green-500", watch: "bg-amber-500", bad: "bg-red-500" }[band.tone];
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold uppercase tracking-wide text-neutral-400">Severity</span>
        <span className="font-medium text-neutral-600">
          {band.label} · {score}/10
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-200"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={score}
        aria-label="Severity score"
      >
        <motion.div
          className={`h-full rounded-full ${fill}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(score, 0.4) * 10}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
