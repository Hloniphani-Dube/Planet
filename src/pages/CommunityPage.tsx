import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useSavedLocation, useShareLevel } from "../hooks/useSavedLocation";
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ORDER } from "../lib/categories";
import { listCommunityReports } from "../lib/reports";
import { supabase } from "../lib/supabase";
import { timeAgo } from "../lib/time";
import type { IssueCategory, PlantReport } from "../lib/types";

// Leaflet is the heaviest dependency; only load it when this page is opened.
const CommunityMap = lazy(() => import("../components/CommunityMap"));

type Scope = "near" | "all";
const RADII = [10, 30, 100] as const;

export function CommunityPage() {
  const location = useSavedLocation();
  const shareLevel = useShareLevel();

  const [scope, setScope] = useState<Scope>(location ? "near" : "all");
  const [radiusKm, setRadiusKm] = useState<(typeof RADII)[number]>(30);
  const [reports, setReports] = useState<PlantReport[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<IssueCategory>>(new Set());
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Without a saved location "near me" has no meaning, so fall back to everywhere.
  const effectiveScope: Scope = location ? scope : "all";
  const lat = location?.lat;
  const lng = location?.lng;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCommunityReports({
        near:
          effectiveScope === "near" && lat !== undefined && lng !== undefined
            ? { center: { lat, lng }, radiusKm }
            : undefined,
      });
      setReports(result.reports);
      setUserId(result.userId);
    } catch (err) {
      console.error("Failed to load community reports", err);
      setError("Couldn't load community reports. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [effectiveScope, lat, lng, radiusKm]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleReaction(report: PlantReport) {
    if (!userId) return;
    setBusyId(report.id);
    try {
      const { error: reactionError } = report.reactedByMe
        ? await supabase.from("report_reactions").delete().eq("report_id", report.id).eq("user_id", userId)
        : await supabase.from("report_reactions").insert({ report_id: report.id, user_id: userId });
      if (reactionError) throw reactionError;
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, reactedByMe: !r.reactedByMe, helpfulCount: r.helpfulCount + (r.reactedByMe ? -1 : 1) }
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
      const { error: updateError } = await supabase
        .from("reports")
        .update({ resolved: !report.resolved })
        .eq("id", report.id);
      if (updateError) throw updateError;
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, resolved: !r.resolved } : r)));
    } catch (err) {
      console.error("Failed to update resolved status", err);
    } finally {
      setBusyId(null);
    }
  }

  function toggleCategory(category: IssueCategory) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  const counts = useMemo(() => {
    const tally = new Map<IssueCategory, number>();
    for (const report of reports) {
      tally.set(report.diagnosis.category, (tally.get(report.diagnosis.category) ?? 0) + 1);
    }
    return tally;
  }, [reports]);

  const visible = useMemo(() => reports.filter((r) => !hidden.has(r.diagnosis.category)), [reports, hidden]);
  const pinned = useMemo(() => visible.filter((r) => r.lat !== undefined && r.lng !== undefined), [visible]);

  const speciesOptions = useMemo(
    () => Array.from(new Set(visible.map((r) => r.diagnosis.plantName))).sort(),
    [visible],
  );
  const listed = useMemo(
    () => (speciesFilter === "all" ? visible : visible.filter((r) => r.diagnosis.plantName === speciesFilter)),
    [visible, speciesFilter],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-black">Near you</h1>
          <p className="text-sm text-neutral-500">What other gardeners are seeing on their plants.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Report scope">
            {(["near", "all"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={effectiveScope === option}
                disabled={option === "near" && !location}
                onClick={() => setScope(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                  effectiveScope === option ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-black"
                }`}
              >
                {option === "near" ? "Near me" : "Everywhere"}
              </button>
            ))}
          </div>
          {effectiveScope === "near" && (
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value) as (typeof RADII)[number])}
              aria-label="Search radius"
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-700"
            >
              {RADII.map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!location && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-neutral-100 p-3 text-xs text-neutral-600">
          <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Set your location to see reports near you.{" "}
            <Link to="/settings#location" className="font-semibold text-black underline">
              Set location
            </Link>
          </span>
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
        <aside className="lg:col-start-2 lg:row-start-1">
          <h2 className="mb-2 hidden text-sm font-semibold text-black lg:block">What's going around</h2>
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
            {CATEGORY_ORDER.map((category) => {
              const count = counts.get(category) ?? 0;
              const off = hidden.has(category);
              return (
                <li key={category}>
                  <button
                    type="button"
                    aria-pressed={!off}
                    onClick={() => toggleCategory(category)}
                    disabled={count === 0}
                    className={`flex w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 lg:rounded-xl lg:py-2.5 lg:text-sm ${
                      off
                        ? "border-neutral-200 text-neutral-400 line-through"
                        : "border-neutral-300 text-black hover:border-black"
                    }`}
                  >
                    <span className="size-2.5 rounded-full" style={{ background: CATEGORY_COLORS[category] }} aria-hidden />
                    <span className="flex-1 text-left">{CATEGORY_LABELS[category]}</span>
                    <span className="rounded-full bg-neutral-100 px-2 text-xs font-semibold">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}{" "}
              <button type="button" onClick={() => void load()} className="font-semibold underline">
                Try again
              </button>
            </div>
          ) : (
            <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-neutral-100 sm:h-[26rem]" />}>
              <CommunityMap
                reports={pinned}
                center={location ? { lat: location.lat, lng: location.lng } : null}
                fitKey={`${effectiveScope}:${radiusKm}:${lat ?? ""}:${lng ?? ""}:${loading ? "loading" : "ready"}`}
              />
            </Suspense>
          )}

          {!loading && !error && pinned.length === 0 && (
            <p className="mt-3 rounded-xl bg-neutral-100 p-3 text-xs text-neutral-600">
              {reports.length === 0
                ? "No reports here yet. Be the first to scan a plant."
                : "Nothing to pin with the current filters."}
              {shareLevel === "off" && (
                <>
                  {" "}
                  Your own scans aren't on the map.{" "}
                  <Link to="/settings#location" className="font-semibold text-black underline">
                    Share your approximate area
                  </Link>
                </>
              )}
            </p>
          )}
          <p className="mt-2 text-[11px] text-neutral-400">
            Locations are rounded to the centre of a grid square (about 1 km, or 150 m at most) before they're
            saved, so nobody's exact position is stored.
          </p>

          {loading && <p className="mt-4 text-sm text-neutral-500">Loading.</p>}

          {listed.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-black">Recent reports</h2>
                <select
                  value={speciesFilter}
                  onChange={(e) => setSpeciesFilter(e.target.value)}
                  aria-label="Filter by plant"
                  className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700"
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
                {listed.slice(0, 40).map((report) => (
                  <li key={report.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-3">
                      {report.photoUrls[0] && (
                        <Link to={`/report/${report.id}`} className="shrink-0">
                          <img src={report.photoUrls[0]} alt="" loading="lazy" className="size-16 rounded-xl object-cover" />
                        </Link>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <Link to={`/report/${report.id}`} className="truncate text-sm font-medium text-black hover:underline">
                            {report.diagnosis.plantName}
                          </Link>
                          {report.resolved && (
                            <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">Solved</span>
                          )}
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: CATEGORY_COLORS[report.diagnosis.category] }}
                            aria-hidden
                          />
                          {CATEGORY_LABELS[report.diagnosis.category]} · {timeAgo(report.createdAt)}
                        </p>
                        <p className="mt-1.5 line-clamp-3 text-sm text-neutral-700">{report.diagnosis.summary}</p>
                      </div>
                    </div>

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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
