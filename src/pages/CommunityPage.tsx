import { useEffect, useMemo, useState } from "react";
import { ensureAnonymousSession, supabase } from "../lib/supabase";
import { STOCK_IMAGES } from "../lib/images";
import type { PlantReport } from "../lib/types";

interface TrendRow {
  category: string;
  count: number;
}

export function CommunityPage() {
  const [reports, setReports] = useState<PlantReport[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const user = await ensureAnonymousSession();
      setUserId(user.id);

      const [{ data, error }, { data: myReactions }] = await Promise.all([
        supabase
          .from("reports")
          .select("*, report_reactions(count)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("report_reactions").select("report_id").eq("user_id", user.id),
      ]);
      if (error) throw error;

      const reactedIds = new Set((myReactions ?? []).map((row) => row.report_id as string));

      setReports(
        (data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          photoUrls: row.photo_urls ?? [],
          diagnosis: {
            plantName: row.plant_name,
            category: row.category,
            summary: row.summary,
            fix: row.fix,
            confidence: row.confidence,
          },
          lat: row.lat ?? undefined,
          lng: row.lng ?? undefined,
          resolved: row.resolved,
          helpfulCount: row.report_reactions?.[0]?.count ?? 0,
          reactedByMe: reactedIds.has(row.id),
          createdAt: new Date(row.created_at).getTime(),
          synced: true,
        })),
      );
    } catch (err) {
      console.error("Failed to load community reports", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleReaction(report: PlantReport) {
    if (!userId) return;
    setBusyId(report.id);
    try {
      if (report.reactedByMe) {
        await supabase
          .from("report_reactions")
          .delete()
          .eq("report_id", report.id)
          .eq("user_id", userId);
      } else {
        await supabase.from("report_reactions").insert({ report_id: report.id, user_id: userId });
      }
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                reactedByMe: !r.reactedByMe,
                helpfulCount: r.helpfulCount + (r.reactedByMe ? -1 : 1),
              }
            : r,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle reaction", err);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleResolved(report: PlantReport) {
    setBusyId(report.id);
    try {
      await supabase.from("reports").update({ resolved: !report.resolved }).eq("id", report.id);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, resolved: !r.resolved } : r)),
      );
    } catch (err) {
      console.error("Failed to update resolved status", err);
    } finally {
      setBusyId(null);
    }
  }

  const speciesOptions = useMemo(
    () => Array.from(new Set(reports.map((r) => r.diagnosis.plantName))).sort(),
    [reports],
  );

  const visibleReports = useMemo(
    () =>
      speciesFilter === "all"
        ? reports
        : reports.filter((r) => r.diagnosis.plantName === speciesFilter),
    [reports, speciesFilter],
  );

  const trends: TrendRow[] = Object.entries(
    reports.reduce<Record<string, number>>((acc, report) => {
      const key = report.diagnosis.category;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <img
        src={STOCK_IMAGES.community}
        alt=""
        className="grayscale-photo mb-6 h-32 w-full rounded-2xl object-cover"
      />

      <h1 className="mb-1 text-2xl font-semibold text-black">Trending near you</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Issues other gardeners have reported recently.
      </p>

      {loading && <p className="text-sm text-neutral-500">Loading.</p>}

      {!loading && trends.length === 0 && (
        <p className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-700">
          No community reports yet. Be the first to diagnose a plant.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {trends.map((trend) => (
          <li
            key={trend.category}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm font-medium text-black">
              {trend.category.replace(/_/g, " ")}
            </span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-black">
              {trend.count} reports
            </span>
          </li>
        ))}
      </ul>

      {reports.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Recent reports</h2>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
            >
              <option value="all">All plants</option>
              {speciesOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <ul className="flex flex-col gap-3">
            {visibleReports.map((report) => (
              <li key={report.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-black">{report.diagnosis.plantName}</span>
                  {report.resolved && (
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">
                      Solved
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  {report.diagnosis.category.replace(/_/g, " ")}
                </p>
                <p className="mt-2 text-sm text-neutral-700">{report.diagnosis.summary}</p>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={busyId === report.id}
                    onClick={() => toggleReaction(report)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                      report.reactedByMe
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 text-neutral-600 hover:border-black hover:text-black"
                    }`}
                  >
                    Helpful ({report.helpfulCount})
                  </button>

                  {report.userId === userId && (
                    <button
                      type="button"
                      disabled={busyId === report.id}
                      onClick={() => toggleResolved(report)}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-black hover:text-black disabled:opacity-50"
                    >
                      {report.resolved ? "Mark unsolved" : "Mark solved"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
