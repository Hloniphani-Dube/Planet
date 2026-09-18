import { useState } from "react";
import { Link } from "react-router-dom";
import { PhotoCapture } from "../components/PhotoCapture";
import { DiagnosisCard } from "../components/DiagnosisCard";
import { diagnosePlant } from "../lib/api";
import {
  CLIENT_PROVIDER_IDS,
  CLIENT_PROVIDERS,
  diagnosePlantInBrowser,
  testApiKeyInBrowser,
} from "../lib/clientDiagnose";
import { EdgeFunctionError } from "../lib/functions";
import { queuePhotos, saveReport } from "../lib/sync";
import { STOCK_IMAGES } from "../lib/images";
import { useMode } from "../lib/mode";
import { getLocalWeather } from "../lib/weather";
import { OFFLINE_TIPS } from "../lib/offlineTips";
import type { AiProvider, Diagnosis } from "../lib/types";

type KeyTestStatus = "idle" | "testing" | "valid" | "invalid";

export function DiagnosePage() {
  const { mode } = useMode();
  const isDemo = mode === "demo";

  const [demoProvider, setDemoProvider] = useState<AiProvider>("claude");
  const [demoApiKey, setDemoApiKey] = useState("");
  const [demoKeyConfirmed, setDemoKeyConfirmed] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<KeyTestStatus>("idle");
  const [keyTestMessage, setKeyTestMessage] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Blob[]>([]);
  const [includeWeather, setIncludeWeather] = useState(false);
  const [busy, setBusy] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showOfflineTips, setShowOfflineTips] = useState(false);

  async function handleTestKey() {
    setKeyTestStatus("testing");
    setKeyTestMessage(null);
    try {
      await testApiKeyInBrowser(demoProvider, demoApiKey);
      setKeyTestStatus("valid");
    } catch (err) {
      setKeyTestStatus("invalid");
      setKeyTestMessage(err instanceof Error ? err.message : "That key was rejected.");
    }
  }

  async function handleDiagnose() {
    if (photos.length === 0) return;

    setBusy(true);
    setError(null);
    setNeedsSetup(false);
    setDiagnosis(null);
    setQueued(false);
    setShowOfflineTips(false);

    if (!navigator.onLine) {
      if (!isDemo) {
        await queuePhotos(photos);
        setQueued(true);
      }
      setShowOfflineTips(true);
      setBusy(false);
      return;
    }

    let weatherContext: string | undefined;
    let coords: { lat: number; lng: number } | undefined;
    if (includeWeather) {
      const weather = await getLocalWeather();
      if (weather) {
        weatherContext = weather.description;
        coords = { lat: weather.lat, lng: weather.lng };
      }
    }

    try {
      const result = isDemo
        ? await diagnosePlantInBrowser(demoProvider, demoApiKey, photos, weatherContext)
        : await diagnosePlant(photos, weatherContext);
      setDiagnosis(result);
      if (!isDemo) {
        await saveReport(photos, result, coords?.lat, coords?.lng);
      }
    } catch (err) {
      console.error(err);

      if (!isDemo && err instanceof EdgeFunctionError && err.status === 412) {
        setError(err.message);
        setNeedsSetup(true);
        setBusy(false);
        return;
      }

      if (isDemo) {
        setError(
          err instanceof Error
            ? `Couldn't get a diagnosis. ${err.message}`
            : "Couldn't get a diagnosis. Check your API key and try again.",
        );
      } else {
        await queuePhotos(photos);
        setQueued(true);
        setError("Couldn't reach the diagnosis service. Saved for later instead.");
        setShowOfflineTips(true);
      }
    } finally {
      setBusy(false);
    }
  }

  if (isDemo && !demoKeyConfirmed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-10 text-center">
        <img
          src={STOCK_IMAGES.diagnoseHero}
          alt=""
          className="grayscale-photo h-32 w-full rounded-2xl object-cover"
        />
        <h1 className="text-xl font-semibold text-black">Bring your own API key</h1>
        <p className="text-sm text-neutral-500">
          The demo runs entirely in your browser. Your key is used to call the AI
          provider directly and isn't sent anywhere else or saved. It's cleared the
          moment you refresh this page.
        </p>

        <div className="flex w-full flex-col gap-3 rounded-2xl border border-neutral-200 p-4 text-left">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Provider
          </span>
          <div className="flex gap-2">
            {CLIENT_PROVIDER_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDemoProvider(id);
                  setKeyTestStatus("idle");
                  setKeyTestMessage(null);
                }}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                  demoProvider === id
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-black"
                }`}
              >
                {CLIENT_PROVIDERS[id].label}
              </button>
            ))}
          </div>

          <label className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            API key
            <input
              type="password"
              value={demoApiKey}
              onChange={(e) => {
                setDemoApiKey(e.target.value);
                setKeyTestStatus("idle");
                setKeyTestMessage(null);
              }}
              placeholder="Paste your key"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal normal-case text-black"
            />
          </label>
          <a
            href={CLIENT_PROVIDERS[demoProvider].helpUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neutral-500 underline"
          >
            Get a key at {CLIENT_PROVIDERS[demoProvider].helpText}
          </a>

          <div className="mt-1 flex gap-2">
            <button
              type="button"
              disabled={demoApiKey.trim().length < 10 || keyTestStatus === "testing"}
              onClick={handleTestKey}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-50"
            >
              {keyTestStatus === "testing" ? "Testing." : "Test key"}
            </button>
            <button
              type="button"
              disabled={demoApiKey.trim().length < 10}
              onClick={() => setDemoKeyConfirmed(true)}
              className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Start diagnosing
            </button>
          </div>

          {keyTestStatus === "valid" && (
            <p className="text-xs font-medium text-green-700">Key looks valid.</p>
          )}
          {keyTestStatus === "invalid" && (
            <p className="text-xs font-medium text-red-600">{keyTestMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      <img
        src={STOCK_IMAGES.diagnoseHero}
        alt=""
        className="grayscale-photo h-40 w-full max-w-md rounded-2xl object-cover"
      />

      {isDemo && (
        <button
          type="button"
          onClick={() => setDemoKeyConfirmed(false)}
          className="max-w-sm rounded-full border border-neutral-300 px-4 py-1.5 text-center text-xs font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
        >
          Demo mode with {CLIENT_PROVIDERS[demoProvider].label}. Nothing is saved. Change key
        </button>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-black">What's wrong with your plant?</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Add one or more photos and get a diagnosis with a low-cost fix.
        </p>
      </div>

      <PhotoCapture photos={photos} onChange={setPhotos} />

      <label className="flex max-w-md items-center gap-2 text-xs text-neutral-500">
        <input
          type="checkbox"
          checked={includeWeather}
          onChange={(e) => setIncludeWeather(e.target.checked)}
          className="h-4 w-4 accent-black"
        />
        Factor in local weather (uses your device location)
      </label>

      <button
        type="button"
        disabled={photos.length === 0 || busy}
        onClick={handleDiagnose}
        className="rounded-full bg-black px-6 py-3 font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {busy ? "Diagnosing." : "Diagnose"}
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
      {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}

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
