import { useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Plus, Sprout } from "lucide-react";
import { GardenTabs } from "../components/GardenTabs";
import { WeatherBanner } from "../components/WeatherBanner";
import { useMyPlants } from "../hooks/useMyPlants";
import { ensureWateringSchedule } from "../lib/careTasks";
import { healthDotColor, healthLabels } from "../lib/health";
import { catalogCareProfile, findCatalogPlant } from "../lib/plantCatalog";
import { createPlant } from "../lib/plants";

export function PlantsPage() {
  const { plants, error, refresh } = useMyPlants();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [environment, setEnvironment] = useState<"indoor" | "outdoor" | "">("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const match = findCatalogPlant(name) ?? findCatalogPlant(species);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      // A plant we know gets its care profile straight away, so watering reminders and
      // weather alerts work before the first scan.
      const careProfile = match ? catalogCareProfile(match) : undefined;
      const plant = await createPlant({
        name: name.trim(),
        species: species.trim() || match?.scientificName,
        environment: environment || undefined,
        careProfile,
      });
      if (careProfile) await ensureWateringSchedule({ plantId: plant.id, plantName: plant.name }, careProfile);
      setName("");
      setSpecies("");
      setEnvironment("");
      setShowForm(false);
      await refresh();
    } catch (err) {
      console.error("Failed to create plant", err);
      setFormError("Couldn't add that plant. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-10">
      <GardenTabs />

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black">Your garden</h1>
          <p className="text-sm text-neutral-500">Track each plant's health over time.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} aria-hidden />
          Add plant
        </button>
      </div>

      <WeatherBanner />

      {showForm && (
        <div className="mb-6 mt-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4">
          <input
            type="text"
            placeholder="Name (e.g. Tomato)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Species (optional)"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            {(["indoor", "outdoor"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEnvironment(environment === option ? "" : option)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  environment === option
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-black"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {match && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
              We know {match.name.toLowerCase()}: watering reminders and weather alerts start straight
              away.
            </p>
          )}
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <button
            type="button"
            disabled={!name.trim() || saving}
            onClick={handleCreate}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Adding." : "Add to garden"}
          </button>
        </div>
      )}

      {plants === null && <p className="mt-4 text-sm text-neutral-500">Loading.</p>}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}{" "}
          <button type="button" onClick={() => void refresh()} className="font-semibold underline">
            Try again
          </button>
        </p>
      )}

      {plants !== null && plants.length === 0 && !error && (
        <div className="mt-4 rounded-2xl bg-neutral-100 p-6 text-center">
          <p className="text-sm font-semibold text-black">Your garden is empty.</p>
          <p className="mt-1 text-sm text-neutral-600">
            Scan your first plant and Planet-i-Green will start building its health history, or browse
            the guide for something to grow.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
              Scan a plant
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-black"
            >
              <Compass size={14} aria-hidden />
              Plant guide
            </Link>
          </div>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {(plants ?? []).map((plant) => (
          <li key={plant.id}>
            <Link
              to={`/plants/${plant.id}`}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-black"
            >
              {plant.photoUrls[0] ? (
                <img src={plant.photoUrls[0]} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                  <Sprout size={22} aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-black">{plant.name}</p>
                {plant.species && <p className="truncate text-xs italic text-neutral-500">{plant.species}</p>}
                <p className="mt-0.5 text-xs text-neutral-400 capitalize">{plant.environment ?? "Location not set"}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                <span className={`h-2 w-2 rounded-full ${healthDotColor[plant.healthStatus]}`} aria-hidden />
                {healthLabels[plant.healthStatus]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
