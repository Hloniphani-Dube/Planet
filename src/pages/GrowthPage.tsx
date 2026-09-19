import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flower2, Sprout } from "lucide-react";
import { GardenTabs } from "../components/GardenTabs";
import { SeverityChart, TrendChip } from "../components/SeverityChart";
import { severityBand } from "../lib/diagnosis";
import { listPlants } from "../lib/plants";
import { listMyReports } from "../lib/reports";
import type { Plant, PlantReport } from "../lib/types";

interface PlantSeries {
  key: string;
  name: string;
  plantId?: string;
  reports: PlantReport[];
}

const BADGE = {
  good: "bg-green-100 text-green-800",
  watch: "bg-amber-100 text-amber-800",
  bad: "bg-red-100 text-red-700",
} as const;

/** Groups scans by plant profile where there is one, and by plant name otherwise. */
function groupReports(reports: PlantReport[], plants: Plant[]): PlantSeries[] {
  const names = new Map(plants.map((p) => [p.id, p.name]));
  const groups = new Map<string, PlantSeries>();

  for (const report of reports) {
    const key = report.plantId ?? `name:${report.diagnosis.plantName.toLowerCase()}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        plantId: report.plantId,
        name: (report.plantId && names.get(report.plantId)) || report.diagnosis.plantName,
        reports: [],
      };
      groups.set(key, group);
    }
    group.reports.push(report);
  }
  // Plants with the most recent scan first.
  return [...groups.values()].sort(
    (a, b) => b.reports[b.reports.length - 1].createdAt - a.reports[a.reports.length - 1].createdAt,
  );
}

export function GrowthPage() {
  const [series, setSeries] = useState<PlantSeries[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listMyReports(), listPlants().catch(() => [] as Plant[])]).then(([reports, plants]) => {
      if (!cancelled) setSeries(groupReports(reports, plants));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(() => (series ?? []).reduce((sum, s) => sum + s.reports.length, 0), [series]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-10">
      <GardenTabs />

      <h1 className="text-2xl font-semibold text-black">Growth trends</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">
        Is each plant recovering or getting worse? Severity from every scan, plotted over time.
      </p>

      {series === null && <p className="text-sm text-neutral-500">Loading.</p>}

      {series !== null && series.length === 0 && (
        <div className="rounded-2xl bg-neutral-100 p-6 text-center">
          <p className="text-sm font-semibold text-black">No scans to chart yet</p>
          <p className="mt-1 text-sm text-neutral-600">
            Scan the same plant a few times over a week or two to see its trend.
          </p>
          <Link to="/" className="mt-4 inline-block rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
            Scan a plant
          </Link>
        </div>
      )}

      {series !== null && series.length > 0 && total < 2 && (
        <p className="mb-4 rounded-xl bg-neutral-100 p-3 text-xs text-neutral-600">
          One scan is a starting point. Scan again in a few days and a trend line will appear.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {(series ?? []).map((plant) => {
          const points = plant.reports.map((r) => ({
            id: r.id,
            date: r.createdAt,
            severity: r.diagnosis.severityScore,
          }));
          const latest = plant.reports[plant.reports.length - 1];
          const tipReport = [...plant.reports].reverse().find((r) => r.diagnosis.companionTip || r.diagnosis.nativeAlternative);

          return (
            <section key={plant.key} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-black">
                    {plant.plantId ? (
                      <Link to={`/plants/${plant.plantId}`} className="hover:underline">
                        {plant.name}
                      </Link>
                    ) : (
                      plant.name
                    )}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {plant.reports.length} scan{plant.reports.length === 1 ? "" : "s"}
                    {plant.reports.length > 0 &&
                      ` · last ${new Date(latest.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                  </p>
                </div>
                <TrendChip points={points} />
              </div>

              <SeverityChart points={points} />

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {plant.reports.map((report) => {
                  const band = severityBand(report.diagnosis.severityScore);
                  return (
                    <Link key={report.id} to={`/report/${report.id}`} className="w-20 shrink-0 text-center">
                      {report.photoUrls[0] ? (
                        <img
                          src={report.photoUrls[0]}
                          alt={`${plant.name} on ${new Date(report.createdAt).toLocaleDateString()}`}
                          loading="lazy"
                          className="size-20 rounded-xl object-cover shadow-sm"
                        />
                      ) : (
                        <span className="flex size-20 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                          <Sprout size={20} aria-hidden />
                        </span>
                      )}
                      <span className="mt-1 flex items-center justify-center gap-1 text-[11px] text-neutral-500">
                        {new Date(report.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        <span className={`rounded-full px-1 font-semibold ${BADGE[band.tone]}`}>
                          {report.diagnosis.severityScore}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>

              {tipReport && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-800">
                    <Flower2 size={13} aria-hidden />
                    Ongoing tip
                  </p>
                  {tipReport.diagnosis.companionTip && (
                    <p className="mt-1 text-sm text-neutral-800">{tipReport.diagnosis.companionTip}</p>
                  )}
                  {tipReport.diagnosis.nativeAlternative && (
                    <p className="mt-1 text-sm text-neutral-800">{tipReport.diagnosis.nativeAlternative}</p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
