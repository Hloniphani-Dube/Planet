import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { PhotoCapture } from "../components/PhotoCapture";
import { DiagnosisCard } from "../components/DiagnosisCard";
import { DemoKeyForm } from "../components/DemoKeyForm";
import { InstallBanner } from "../components/InstallApp";
import { SeverityChart, TrendChip } from "../components/SeverityChart";
import { WeatherBanner } from "../components/WeatherBanner";
import { diagnosePlant } from "../lib/api";
import { CLIENT_PROVIDERS, diagnosePlantInBrowser } from "../lib/clientDiagnose";
import { EdgeFunctionError } from "../lib/functions";
import { queuePhotos, saveDiagnosisToGarden, type PlantChoice } from "../lib/sync";
import { STOCK_IMAGES } from "../lib/images";
import { useMode } from "../lib/mode";
import { useSession } from "../lib/session";
import { getLocalWeather } from "../lib/weather";
import { OFFLINE_TIPS } from "../lib/offlineTips";
import { addDemoObservation, createDemoPlant, listDemoPlants } from "../lib/demoPlants";
import { listPlants } from "../lib/plants";
import { getReportLocation, setShareLevel, type ShareLevel } from "../lib/location";
import { useSavedLocation, useShareLevel } from "../hooks/useSavedLocation";
import { atNineAm } from "../lib/careTasks";
import { downloadIcs } from "../lib/ics";
import { healthDotColor, healthLabels } from "../lib/health";
import type { BlurredPoint } from "../lib/geo";
import type { DemoPlant, Diagnosis, Plant } from "../lib/types";

const NEW_PLANT = "__new__";
const ONE_OFF = "__none__";

const SHARE_LABELS: Record<ShareLevel, string> = {
  off: "off",
  area: "about 1 km",
  street: "about 150 m",
};

export function DiagnosePage() {
  const { mode, chooseMode } = useMode();
  const isDemo = mode === "demo";
  const session = useSession();
  const {
    demoProvider,
    setDemoProvider,
    demoApiKey,
    setDemoApiKey,
    demoKeyConfirmed,
    setDemoKeyConfirmed,
    lastScan,
    setLastScan,
  } = session;

  const [params] = useSearchParams();
  const shareLevel = useShareLevel();
  const savedLocation = useSavedLocation();

  const [photos, setPhotos] = useState<Blob[]>([]);
  const [includeWeather, setIncludeWeather] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [plantNameInput, setPlantNameInput] = useState("");
  const [environment, setEnvironment] = useState<"indoor" | "outdoor" | "">("");
  const [noticed, setNoticed] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState("");
  const [treatmentTried, setTreatmentTried] = useState("");

  const [myPlants, setMyPlants] = useState<Plant[]>([]);
  const [plantSelection, setPlantSelection] = useState(params.get("plant") ?? NEW_PLANT);
  const [activeDemoPlant, setActiveDemoPlant] = useState<DemoPlant | null>(null);

  const [busy, setBusy] = useState(false);
  const [followUpSet, setFollowUpSet] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showOfflineTips, setShowOfflineTips] = useState(false);
  const [retryingSave, setRetryingSave] = useState(false);

  // What was scanned, kept so a failed save can be retried without diagnosing again.
  const [pendingSave, setPendingSave] = useState<{
    photos: Blob[];
    diagnosis: Diagnosis;
    choice: PlantChoice;
    location?: BlurredPoint;
  } | null>(null);

  const diagnosis = lastScan?.diagnosis ?? null;

  useEffect(() => {
    if (isDemo) {
      void listDemoPlants().then((plants) => setActiveDemoPlant(plants[0] ?? null));
    } else {
      void listPlants()
        .then((plants) => {
          setMyPlants(plants);
          // A plant chosen elsewhere (e.g. "Scan this plant again") that no longer exists
          // falls back to a new plant rather than a blank select.
          setPlantSelection((current) =>
            current === NEW_PLANT || current === ONE_OFF || plants.some((p) => p.id === current)
              ? current
              : NEW_PLANT,
          );
        })
        .catch(() => {});
    }
  }, [isDemo]);

  function buildNotes(): string | undefined {
    const parts: string[] = [];
    if (plantNameInput.trim()) parts.push(`Plant name given by the user: ${plantNameInput.trim()}.`);
    if (environment) parts.push(`Environment: ${environment}.`);
    if (noticed.trim()) parts.push(`What they've noticed: ${noticed.trim()}.`);
    if (wateringFrequency.trim()) parts.push(`Watering frequency: ${wateringFrequency.trim()}.`);
    if (treatmentTried.trim()) parts.push(`Treatment already attempted: ${treatmentTried.trim()}.`);
    return parts.length > 0 ? parts.join(" ") : undefined;
  }

  function currentChoice(): PlantChoice {
    if (plantSelection === ONE_OFF) return { kind: "none" };
    const existing = myPlants.find((p) => p.id === plantSelection);
    if (existing) return { kind: "existing", plant: existing };
    return { kind: "new", name: plantNameInput.trim() || undefined, environment: environment || undefined };
  }

  async function handleDiagnose() {
    if (photos.length === 0) return;

    setBusy(true);
    setError(null);
    setNeedsSetup(false);
    setLastScan(null);
    setPendingSave(null);
    setFollowUpSet(false);
    setQueued(false);
    setShowOfflineTips(false);

    const choice = currentChoice();
    const userNotes = buildNotes();

    if (!navigator.onLine) {
      if (!isDemo) {
        await queuePhotos(photos, {
          plantId: choice.kind === "existing" ? choice.plant.id : undefined,
          addToGarden: choice.kind === "new",
          plantNameInput: plantNameInput.trim() || undefined,
          environment: environment || undefined,
          userNotes,
          location: await getReportLocation(),
        });
        setQueued(true);
      }
      setShowOfflineTips(true);
      setBusy(false);
      return;
    }

    let weatherContext: string | undefined;
    if (includeWeather) {
      const weather = await getLocalWeather();
      if (weather) weatherContext = weather.description;
    }

    let result: Diagnosis;
    try {
      result = isDemo
        ? await diagnosePlantInBrowser(demoProvider, demoApiKey, photos, weatherContext, userNotes)
        : await diagnosePlant(photos, weatherContext, userNotes);
    } catch (err) {
      console.error(err);

      if (!isDemo && err instanceof EdgeFunctionError && err.status === 412) {
        setError(err.message);
        setNeedsSetup(true);
      } else if (isDemo) {
        setError(
          err instanceof Error
            ? `Couldn't get a diagnosis. ${err.message}`
            : "Couldn't get a diagnosis. Check your API key and try again.",
        );
      } else {
        await queuePhotos(photos, {
          plantId: choice.kind === "existing" ? choice.plant.id : undefined,
          addToGarden: choice.kind === "new",
          plantNameInput: plantNameInput.trim() || undefined,
          environment: environment || undefined,
          userNotes,
          weatherContext,
          location: await getReportLocation(),
        });
        setQueued(true);
        setError("Couldn't reach the diagnosis service. Saved for later instead.");
        setShowOfflineTips(true);
      }
      setBusy(false);
      return;
    }

    const photo = photos[0];
    setLastScan({ diagnosis: result, photo });

    try {
      if (isDemo) {
        await saveDemoObservation(result);
      } else {
        const location = await getReportLocation();
        setPendingSave({ photos, diagnosis: result, choice, location });
        await saveToGarden({ photos, diagnosis: result, choice, location });
      }
    } catch (err) {
      // The diagnosis itself worked, so keep showing it and offer a retry for the save,
      // rather than throwing the result away and diagnosing the same photos again later.
      console.error("Couldn't save the scan", err);
      setLastScan({ diagnosis: result, photo, saveFailed: true });
    } finally {
      setBusy(false);
    }
  }

  async function saveDemoObservation(result: Diagnosis) {
    if (activeDemoPlant) {
      await addDemoObservation(activeDemoPlant.id, result);
      setActiveDemoPlant({
        ...activeDemoPlant,
        healthStatus: result.healthStatus,
        observations: [
          { id: crypto.randomUUID(), diagnosis: result, createdAt: Date.now() },
          ...activeDemoPlant.observations,
        ],
      });
    } else {
      const created = await createDemoPlant(plantNameInput.trim() || result.plantName, result);
      setActiveDemoPlant(created);
    }
  }

  async function saveToGarden(input: NonNullable<typeof pendingSave>) {
    const saved = await saveDiagnosisToGarden(input);
    setLastScan({
      diagnosis: input.diagnosis,
      photo: input.photos[0],
      reportId: saved.report.id,
      plantId: saved.plant?.id,
      plantName: saved.plant?.name,
      remindersAdded: saved.reminders.length,
    });
    setPendingSave(null);
    if (saved.plant) {
      setMyPlants((current) =>
        current.some((p) => p.id === saved.plant!.id)
          ? current.map((p) => (p.id === saved.plant!.id ? saved.plant! : p))
          : [saved.plant!, ...current],
      );
    }
  }

  async function handleRetrySave() {
    if (!pendingSave) return;
    setRetryingSave(true);
    try {
      await saveToGarden(pendingSave);
    } catch (err) {
      console.error("Retry failed", err);
    } finally {
      setRetryingSave(false);
    }
  }

  /** Demo mode has no calendar, so the follow-up becomes a calendar file the person's own
   * calendar app can import. */
  function handleSetFollowUp() {
    if (!diagnosis) return;
    const task = diagnosis.careTasks.find((t) => t.task === "check") ?? diagnosis.careTasks[0];
    downloadIcs(
      [
        {
          id: crypto.randomUUID(),
          plantReportId: "",
          plantName: diagnosis.plantName,
          task: task?.task ?? "check",
          dueAt: atNineAm(task?.inDays ?? diagnosis.followUpDays),
          done: false,
          note: task?.note || diagnosis.fix,
        },
      ],
      "plant-follow-up.ics",
    );
    setFollowUpSet(true);
  }

  if (isDemo && !demoKeyConfirmed) {
    return (
      <DemoKeyForm
        provider={demoProvider}
        onProviderChange={setDemoProvider}
        apiKey={demoApiKey}
        onApiKeyChange={setDemoApiKey}
        onStart={() => setDemoKeyConfirmed(true)}
      />
    );
  }

  const demoPoints =
    activeDemoPlant?.observations
      .map((o) => ({ id: o.id, date: o.createdAt, severity: o.diagnosis.severityScore }))
      .reverse() ?? [];

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6 pb-10">
      <InstallBanner />
      {!isDemo && <WeatherBanner />}

      <img
        src={STOCK_IMAGES.diagnoseHero}
        alt=""
        className="grayscale-photo h-36 w-full max-w-md rounded-2xl object-cover"
      />

      {isDemo && (
        <div className="flex max-w-sm flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setDemoKeyConfirmed(false)}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-center text-xs font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
          >
            Demo mode with {CLIENT_PROVIDERS[demoProvider].label}. Change key
          </button>
          <p className="text-center text-xs text-neutral-400">
            This is a private local session. Your plant history is stored only on this device and is not
            connected to a Planet-i-Green account.
          </p>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-black">What's happening with your plant?</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Add one or more photos and Planet-i-Green will help you understand what's going on and what to
          do next.
        </p>
      </div>

      <PhotoCapture photos={photos} onChange={setPhotos} />

      {!isDemo && (
        <label className="flex w-full max-w-md flex-col gap-1 text-xs text-neutral-500">
          Which plant is this?
          <select
            value={plantSelection}
            onChange={(e) => setPlantSelection(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black"
          >
            <option value={NEW_PLANT}>A new plant (add to my garden)</option>
            {myPlants.length > 0 && (
              <optgroup label="My plants">
                {myPlants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </optgroup>
            )}
            <option value={ONE_OFF}>One-off scan (don't track)</option>
          </select>
        </label>
      )}

      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-xs font-medium text-neutral-500 underline hover:text-black"
        >
          {showDetails ? "Hide optional details" : "Add optional details"}
        </button>

        {showDetails && (
          <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-neutral-200 p-4">
            <input
              type="text"
              placeholder="Plant name or species (optional)"
              value={plantNameInput}
              onChange={(e) => setPlantNameInput(e.target.value)}
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
            <textarea
              placeholder="What have you noticed? (optional)"
              value={noticed}
              onChange={(e) => setNoticed(e.target.value)}
              rows={2}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Watering frequency (optional)"
              value={wateringFrequency}
              onChange={(e) => setWateringFrequency(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Any treatment already attempted (optional)"
              value={treatmentTried}
              onChange={(e) => setTreatmentTried(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex w-full max-w-md flex-col gap-2">
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={includeWeather}
            onChange={(e) => setIncludeWeather(e.target.checked)}
            className="h-4 w-4 accent-black"
          />
          Factor in local weather ({savedLocation ? "uses your saved location" : "uses your device location"})
        </label>

        {!isDemo && (
          <label className="flex items-start gap-2 text-xs text-neutral-500">
            <input
              type="checkbox"
              checked={shareLevel !== "off"}
              onChange={(e) => setShareLevel(e.target.checked ? "area" : "off")}
              className="mt-0.5 h-4 w-4 accent-black"
            />
            <span>
              <span className="flex items-center gap-1">
                <MapPin size={12} aria-hidden />
                Pin this scan on the community map
                {shareLevel !== "off" && ` (${SHARE_LABELS[shareLevel]})`}
              </span>
              <span className="block text-neutral-400">
                Only an approximate area is saved, never your exact position.{" "}
                <Link to="/settings#location" className="underline">
                  Change
                </Link>
              </span>
            </span>
          </label>
        )}
      </div>

      <button
        type="button"
        disabled={photos.length === 0 || busy}
        onClick={handleDiagnose}
        className="rounded-full bg-black px-6 py-3 font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {busy ? "Analyzing." : "Diagnose"}
      </button>

      {queued && (
        <p className="max-w-sm text-center text-sm text-neutral-500">
          Saved on your device. It'll be diagnosed automatically once you're back online.
        </p>
      )}
      {error && (
        <p className="max-w-sm text-center text-sm text-red-600">
          {error}
          {needsSetup && !isDemo && (
            <>
              {" "}
              <Link to="/settings" className="font-medium underline">
                Go to Settings
              </Link>
            </>
          )}
        </p>
      )}

      {diagnosis && lastScan && (
        <DiagnosisCard
          diagnosis={diagnosis}
          photo={lastScan.photo}
          shareUrl={lastScan.reportId ? `${window.location.origin}/report/${lastScan.reportId}` : undefined}
          onSetFollowUp={isDemo ? handleSetFollowUp : undefined}
          followUpSet={followUpSet}
          followUpLabel="Add to my calendar"
          remindersAdded={lastScan.remindersAdded}
        />
      )}

      {lastScan?.saveFailed && (
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          The diagnosis worked, but saving it to your garden didn't.{" "}
          <button
            type="button"
            onClick={handleRetrySave}
            disabled={retryingSave}
            className="font-semibold underline disabled:opacity-50"
          >
            {retryingSave ? "Saving." : "Try saving again"}
          </button>
        </div>
      )}

      {lastScan?.plantId && (
        <Link
          to={`/plants/${lastScan.plantId}`}
          className="w-full max-w-md rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-700 transition-colors hover:border-black"
        >
          Saved to <span className="font-semibold text-black">{lastScan.plantName}</span> in your garden.
          <span className="ml-1 underline">See its timeline</span>
        </Link>
      )}

      {diagnosis && isDemo && activeDemoPlant && (
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-black">My {activeDemoPlant.name}</p>
            <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
              <span
                className={`h-2 w-2 rounded-full ${healthDotColor[activeDemoPlant.healthStatus]}`}
                aria-hidden
              />
              {healthLabels[activeDemoPlant.healthStatus]}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-neutral-500">
            <div>
              <p className="text-neutral-400">Last checked</p>
              <p className="font-medium text-black">Today</p>
            </div>
            <div>
              <p className="text-neutral-400">Observations</p>
              <p className="font-medium text-black">{activeDemoPlant.observations.length}</p>
            </div>
            <div>
              <p className="text-neutral-400">Trend</p>
              <p className="font-medium text-black">
                {demoPoints.length > 1 ? <TrendChip points={demoPoints} /> : "First scan"}
              </p>
            </div>
          </div>
          {demoPoints.length > 1 && (
            <div className="mt-3">
              <SeverityChart points={demoPoints} />
            </div>
          )}
        </div>
      )}

      {diagnosis && isDemo && (
        <div className="w-full max-w-md rounded-2xl bg-neutral-100 p-4 text-center">
          <p className="text-sm font-semibold text-black">Want to keep this plant?</p>
          <p className="mt-1 text-xs text-neutral-600">
            Create a free garden profile to keep your diagnosis, growth timeline, treatments, reminders,
            weather alerts and future scans.
          </p>
          <button
            type="button"
            onClick={() => chooseMode("full")}
            className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Save to Planet-i-Green
          </button>
        </div>
      )}

      {showOfflineTips && (
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 p-4 text-left">
          <p className="mb-3 text-sm font-semibold text-black">
            No connection right now. General tips while you wait:
          </p>
          <ul className="flex flex-col gap-3">
            {OFFLINE_TIPS.map((tip) => (
              <li key={tip.category}>
                <p className="text-sm font-medium text-black">{tip.label}</p>
                <p className="text-xs text-neutral-500">{tip.hint}</p>
                <p className="mt-1 text-xs text-neutral-700">{tip.fix}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
