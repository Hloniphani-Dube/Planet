import { useState, type FormEvent } from "react";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { useSavedLocation, useShareLevel } from "../hooks/useSavedLocation";
import {
  clearLocation,
  locateAndSave,
  saveLocation,
  searchPlaces,
  setShareLevel,
  type PlaceResult,
  type ShareLevel,
} from "../lib/location";

const SHARE_OPTIONS: { value: ShareLevel; label: string; hint: string }[] = [
  { value: "off", label: "Don't share", hint: "Reports have no location and don't appear on the map." },
  { value: "area", label: "Neighbourhood", hint: "Pinned to a square of about 1 km." },
  { value: "street", label: "Nearby", hint: "Pinned to a square of about 150 m." },
];

/** Where you are (for weather alerts) and how much of it, if anything, reports share. */
export function LocationSettings() {
  const location = useSavedLocation();
  const shareLevel = useShareLevel();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState<"gps" | "search" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLocate() {
    setBusy("gps");
    setMessage(null);
    const found = await locateAndSave();
    setBusy(null);
    if (!found) setMessage("Couldn't get your position. Allow location access, or search for your town instead.");
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setBusy("search");
    setMessage(null);
    try {
      const places = await searchPlaces(query);
      setResults(places);
      if (places.length === 0) setMessage("No places found. Try a nearby town.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusy(null);
    }
  }

  function choose(place: PlaceResult) {
    saveLocation({ lat: place.lat, lng: place.lng, label: place.label, source: "search" });
    setResults([]);
    setQuery("");
    setMessage(null);
  }

  return (
    <section id="location" className="scroll-mt-20 rounded-2xl border border-neutral-200 p-4">
      <h2 className="text-base font-semibold text-black">Location</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Used for frost, heat and heavy-rain alerts. It stays on this device and is only ever sent to
        Open-Meteo, as coordinates, to fetch a forecast.
      </p>

      {location ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm text-black">
            <MapPin size={16} className="shrink-0 text-green-700" aria-hidden />
            <span className="truncate">{location.label}</span>
          </span>
          <button
            type="button"
            onClick={clearLocation}
            aria-label="Remove saved location"
            className="text-neutral-500 hover:text-black"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-600">No location set.</p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleLocate}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-50"
        >
          <LocateFixed size={16} aria-hidden />
          {busy === "gps" ? "Locating." : "Use my location"}
        </button>
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or search for your town"
            aria-label="Search for a place"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={query.trim().length < 2 || busy !== null}
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-lg bg-black text-white disabled:opacity-50"
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-neutral-200">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`} className="border-b border-neutral-200 last:border-b-0">
              <button
                type="button"
                onClick={() => choose(place)}
                className="w-full px-3 py-2.5 text-left text-sm text-black hover:bg-neutral-100"
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-2 text-xs text-red-600">{message}</p>}

      <div className="mt-5 border-t border-neutral-200 pt-4">
        <h3 className="text-sm font-semibold text-black">Community map</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Choose whether your scans appear on the community map. Your exact position is never stored:
          it's rounded to the centre of a grid square on this device first.
        </p>
        <div role="radiogroup" aria-label="Community map sharing" className="mt-3 flex flex-col gap-2">
          {SHARE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                shareLevel === option.value ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <input
                type="radio"
                name="share-level"
                checked={shareLevel === option.value}
                onChange={() => setShareLevel(option.value)}
                className="mt-1 accent-black"
              />
              <span>
                <span className="block text-sm font-medium text-black">{option.label}</span>
                <span className="block text-xs text-neutral-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
