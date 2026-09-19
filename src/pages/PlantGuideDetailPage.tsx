import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { CareProfileChips } from "../components/CareProfileView";
import { Disclosure } from "../components/Disclosure";
import { PlantIcon } from "../components/explore/PlantIcon";
import { catalogCareProfile, getCatalogPlant } from "../lib/plantCatalog";
import { ensureWateringSchedule } from "../lib/careTasks";
import { GREEN_ACTIONS } from "../lib/greenActions";
import { useMode } from "../lib/mode";
import { createPlant } from "../lib/plants";

/** The essentials up top (what it is, what it needs, what to do next); everything else is
 * folded away until asked for. */
export function PlantGuideDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { mode } = useMode();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plant = slug ? getCatalogPlant(slug) : undefined;

  if (!plant) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-sm text-neutral-500">That plant isn't in the guide yet.</p>
        <Link to="/explore" className="mt-2 inline-block text-sm font-medium text-black underline">
          Back to the guide
        </Link>
      </div>
    );
  }

  const profile = catalogCareProfile(plant);
  const related = GREEN_ACTIONS.filter((action) => action.plants.includes(plant.slug));

  async function addToGarden() {
    if (!plant) return;
    setAdding(true);
    setError(null);
    try {
      const created = await createPlant({
        name: plant.name,
        species: plant.scientificName,
        environment: plant.places.length === 1 ? plant.places[0] : undefined,
        careProfile: profile,
      });
      await ensureWateringSchedule({ plantId: created.id, plantName: created.name }, profile);
      navigate(`/plants/${created.id}`);
    } catch (err) {
      console.error("Failed to add plant", err);
      setError("Couldn't add it. Check your connection and try again.");
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-10">
      <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black">
        <ArrowLeft size={14} aria-hidden />
        Plant guide
      </Link>

      <div className="mt-5 flex items-center gap-4">
        <PlantIcon kind={plant.kind} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-black">{plant.name}</h1>
          <p className="text-sm italic text-neutral-500">{plant.scientificName}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-neutral-700">{plant.summary}</p>

      <div className="mt-4">
        <CareProfileChips profile={profile} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {mode === "full" ? (
          <button
            type="button"
            onClick={addToGarden}
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <Plus size={16} aria-hidden />
            {adding ? "Adding." : "Add to my garden"}
          </button>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            Scan yours
          </Link>
        )}
        {error && <p className="text-center text-xs text-red-600">{error}</p>}
      </div>

      <div className="mt-6 border-y border-neutral-200">
        <Disclosure title="Why it's good for the planet">{plant.planetNote}</Disclosure>
        <Disclosure title="Growing tips">
          <ul className="flex flex-col gap-2">
            {plant.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </Disclosure>
        <Disclosure title="Grows well with">{plant.companions.join(", ")}</Disclosure>
        {related.length > 0 && (
          <Disclosure title="Green actions using it">
            <ul className="flex flex-col gap-2">
              {related.map((action) => (
                <li key={action.id}>
                  <Link to="/explore?tab=actions" className="text-black underline">
                    {action.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
      </div>
    </div>
  );
}
