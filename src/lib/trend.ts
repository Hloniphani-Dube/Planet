export interface SeverityPoint {
  id: string;
  date: number;
  /** 0 (fine) to 10 (dying). */
  severity: number;
}

export type TrendTone = "good" | "watch" | "bad" | "neutral";

export interface TrendVerdict {
  label: string;
  detail: string;
  tone: TrendTone;
}

/** Answers "is this plant recovering or getting worse?" from severity over time. Compares
 * the latest scan to the average of the couple before it, so one odd photo doesn't flip
 * the verdict. */
export function computeTrend(points: SeverityPoint[]): TrendVerdict {
  const sorted = [...points].sort((a, b) => a.date - b.date);
  if (sorted.length === 0) {
    return { label: "No scans yet", detail: "Scan this plant to start its trend.", tone: "neutral" };
  }
  const latest = sorted[sorted.length - 1];

  if (sorted.length === 1) {
    return {
      label: "First scan",
      detail: "Scan again in a few days to see which way it's heading.",
      tone: "neutral",
    };
  }

  const before = sorted.slice(Math.max(0, sorted.length - 3), -1);
  const baseline = before.reduce((sum, p) => sum + p.severity, 0) / before.length;
  const delta = latest.severity - baseline;

  if (delta <= -1) {
    return {
      label: "Recovering",
      detail: `Severity is down ${Math.abs(delta).toFixed(1)} points from before.`,
      tone: "good",
    };
  }
  if (delta >= 1) {
    return {
      label: "Getting worse",
      detail: `Severity is up ${delta.toFixed(1)} points from before.`,
      tone: "bad",
    };
  }
  if (latest.severity <= 2) {
    return { label: "Thriving", detail: "Steadily healthy across recent scans.", tone: "good" };
  }
  return {
    label: "Holding steady",
    detail: "No clear change yet. Keep following the plan.",
    tone: latest.severity >= 7 ? "bad" : "watch",
  };
}
