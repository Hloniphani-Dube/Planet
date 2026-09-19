import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Flower2, Sprout, Trash2 } from "lucide-react";
import { CareProfileCard } from "../components/CareProfileView";
import { SeverityChart, TrendChip } from "../components/SeverityChart";
import { ShareButton } from "../components/ShareButton";
import { Timeline } from "../components/Timeline";
import { ALERT_ICONS } from "../components/WeatherBanner";
import { useLiveQuery } from "../hooks/useLiveQuery";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import { describeDue, sameTarget, TASK_LABELS } from "../lib/careTasks";
import { db } from "../lib/db";
import { healthDotColor, healthLabels } from "../lib/health";
import { findCatalogPlant } from "../lib/plantCatalog";
import { deletePlant, getPlant, getPlantReports } from "../lib/plants";
import type { Plant, PlantReport } from "../lib/types";

const loadEntries = () => db.careEntries.orderBy("dueAt").toArray();

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [reports, setReports] = useState<PlantReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const entries = useLiveQuery(loadEntries);

  const load = useCallback(async (plantId: string) => {
    setLoading(true);
    setError(false);
    try {
      const [plantData, reportData] = await Promise.all([getPlant(plantId), getPlantReports(plantId)]);
      setPlant(plantData);
      setReports(reportData);
    } catch (err) {
      console.error("Failed to load plant", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) void load(id);
  }, [id, load]);

  const plantList = useMemo(() => (plant ? [plant] : []), [plant]);
  const { alerts } = useWeatherAlerts(plant ? plantList : null);

  const upcoming = useMemo(() => {
    if (!plant) return [];
    return (entries ?? [])
      .filter((e) => !e.done && sameTarget(e, { plantId: plant.id, plantName: plant.name }))
      .slice(0, 3);
  }, [entries, plant]);

  async function handleDelete() {
    if (!plant) return;
    if (!window.confirm(`Remove ${plant.name} from your garden? Its scans stay in the community feed.`)) return;
    try {
      await deletePlant(plant.id);
      // Its reminders no longer have a plant to care for.
      await db.careEntries.filter((entry) => entry.plantId === plant.id).delete();
      navigate("/plants", { replace: true });
    } catch (err) {
      console.error("Failed to delete plant", err);
      window.alert("Couldn't remove that plant. Try again.");
    }
  }

  if (loading) {
    return <p className="px-4 py-8 text-center text-sm text-neutral-500">Loading.</p>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-neutral-500">Couldn't load this plant.</p>
        <button type="button" onClick={() => id && void load(id)} className="mt-2 text-sm font-medium text-black underline">
          Try again
        </button>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-neutral-500">This plant couldn't be found.</p>
        <Link to="/plants" className="mt-2 inline-block text-sm font-medium text-black underline">
          Back to your garden
        </Link>
      </div>
    );
  }

  const latest = reports[0];
  const profile = plant.careProfile ?? latest?.diagnosis.careProfile;
  const points = [...reports].reverse().map((r) => ({ id: r.id, date: r.createdAt, severity: r.diagnosis.severityScore }));
  const tipReport = reports.find((r) => r.diagnosis.companionTip || r.diagnosis.nativeAlternative);
  const guide = findCatalogPlant(plant.name) ?? findCatalogPlant(plant.species);
  const coverPhoto = latest?.photoUrls[0] ?? plant.photoUrls[0];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-10">
      <Link to="/plants" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black">
        <ArrowLeft size={14} aria-hidden />
        Your garden
      </Link>

      {coverPhoto && (
        <img src={coverPhoto} alt={plant.name} className="mt-3 aspect-[16/9] w-full rounded-2xl object-cover" />
      )}

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-black">{plant.name}</h1>
          {plant.species && <p className="text-sm italic text-neutral-500">{plant.species}</p>}
        </div>
        <span className="mt-1.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-neutral-600">
          <span className={`h-2 w-2 rounded-full ${healthDotColor[plant.healthStatus]}`} aria-hidden />
          {healthLabels[plant.healthStatus]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-400">Last checked</p>
          <p className="mt-0.5 font-medium text-black">
            {latest ? new Date(latest.createdAt).toLocaleDateString() : "Never"}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-400">Observations</p>
          <p className="mt-0.5 font-medium text-black">{reports.length}</p>
        </div>
      </div>

      {alerts.filter((a) => a.dayOffset <= 3).length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {alerts
            .filter((a) => a.dayOffset <= 3)
            .map((alert) => {
              const Icon = ALERT_ICONS[alert.kind];
              return (
                <li
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    alert.level === "warning" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-black">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-600">{alert.advice}</p>
                  </div>
                </li>
              );
            })}
        </ul>
      )}

      {latest && (
        <div className="mt-4 rounded-xl bg-neutral-100 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Current observation</p>
          <p className="mt-1 text-sm text-neutral-700">{latest.diagnosis.summary}</p>
          {latest.diagnosis.fix && (
            <p className="mt-2 text-sm text-neutral-800">
              <span className="font-semibold">Fix:</span> {latest.diagnosis.fix}
            </p>
          )}
        </div>
      )}

      {points.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Severity over time</h2>
            <TrendChip points={points} />
          </div>
          <SeverityChart points={points} />
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Coming up</h2>
            <Link to="/calendar" className="text-xs font-medium text-neutral-500 underline">
              Calendar
            </Link>
          </div>
          <ul className="flex flex-col gap-1.5">
            {upcoming.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                <span className="text-black">{TASK_LABELS[entry.task]}</span>
                <span className="text-xs text-neutral-500">{describeDue(entry)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-black">Care profile</h2>
          <CareProfileCard profile={profile} />
        </section>
      )}

      {tipReport && (
        <section className="mt-6 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-black">Ongoing tips</h2>
          {tipReport.diagnosis.companionTip && (
            <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
              <Sprout size={18} className="mt-0.5 shrink-0 text-green-700" aria-hidden />
              <p className="text-sm text-neutral-800">{tipReport.diagnosis.companionTip}</p>
            </div>
          )}
          {tipReport.diagnosis.nativeAlternative && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <Flower2 size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
              <p className="text-sm text-neutral-800">{tipReport.diagnosis.nativeAlternative}</p>
            </div>
          )}
        </section>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-black">Health timeline</h2>
        <Timeline
          entries={reports.map((r) => ({
            id: r.id,
            date: r.createdAt,
            healthStatus: r.diagnosis.healthStatus,
            summary: r.diagnosis.summary,
            severity: r.diagnosis.severityScore,
            photoUrl: r.photoUrls[0],
            href: `/report/${r.id}`,
          }))}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          to={`/?plant=${plant.id}`}
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Scan this plant again
        </Link>
        {latest && (
          <ShareButton
            diagnosis={latest.diagnosis}
            photo={latest.photoUrls[0] ?? ""}
            url={`${window.location.origin}/report/${latest.id}`}
            className="py-2 text-sm"
          />
        )}
        {guide && (
          <Link
            to={`/explore/plants/${guide.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-black"
          >
            <BookOpen size={14} aria-hidden />
            Guide
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-red-600"
      >
        <Trash2 size={14} aria-hidden />
        Remove this plant
      </button>
    </div>
  );
}
