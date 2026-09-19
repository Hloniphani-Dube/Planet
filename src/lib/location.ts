import { blurPoint, type BlurredPoint, type LatLng } from "./geo";

/** Where the person is, for weather alerts. Lives only in this browser; it is never sent
 * anywhere except to Open-Meteo as coordinates when fetching a forecast. */
export interface SavedLocation extends LatLng {
  label: string;
  source: "gps" | "search";
}

/** How much of a report's position is shared with the community map.
 * `off`: nothing. `area`: a cell of roughly 1 km. `street`: roughly 150 m. */
export type ShareLevel = "off" | "area" | "street";

export const SHARE_PRECISION: Record<Exclude<ShareLevel, "off">, number> = {
  area: 6,
  street: 7,
};

const LOCATION_KEY = "planet.location";
const SHARE_KEY = "planet.shareLevel";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private browsing). The choice just won't persist across reloads.
  }
  window.dispatchEvent(new Event("planet:location"));
}

export function getSavedLocation(): SavedLocation | null {
  const value = readJson<SavedLocation>(LOCATION_KEY);
  if (!value || typeof value.lat !== "number" || typeof value.lng !== "number") return null;
  return value;
}

export function saveLocation(location: SavedLocation): void {
  write(LOCATION_KEY, JSON.stringify(location));
}

export function clearLocation(): void {
  write(LOCATION_KEY, null);
}

export function getShareLevel(): ShareLevel {
  try {
    const value = localStorage.getItem(SHARE_KEY);
    return value === "area" || value === "street" ? value : "off";
  } catch {
    return "off";
  }
}

export function setShareLevel(level: ShareLevel): void {
  write(SHARE_KEY, level);
}

/** Subscribes to location or sharing changes, in this tab or another. */
export function subscribeLocation(callback: () => void): () => void {
  window.addEventListener("planet:location", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("planet:location", callback);
    window.removeEventListener("storage", callback);
  };
}

export function getDevicePosition(timeoutMs = 10000): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/** Asks the device for its position and remembers it. Returns null if unavailable/denied. */
export async function locateAndSave(): Promise<SavedLocation | null> {
  const position = await getDevicePosition();
  if (!position) return null;
  const location: SavedLocation = { ...position, label: "Your location", source: "gps" };
  saveLocation(location);
  return location;
}

export interface PlaceResult extends LatLng {
  label: string;
}

/** City search via Open-Meteo's free geocoding API (no key), so people without GPS
 * access, or on a desktop, can still set a location. */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Place search is unavailable right now.");
  const data = (await res.json()) as {
    results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }[];
  };

  return (data.results ?? []).map((place) => ({
    label: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
    lat: place.latitude,
    lng: place.longitude,
  }));
}

/** The position to attach to a report, blurred to the chosen precision, or undefined when
 * the person hasn't opted in. Uses the saved location, else asks the device once. */
export async function getReportLocation(): Promise<BlurredPoint | undefined> {
  const level = getShareLevel();
  if (level === "off") return undefined;

  const saved = getSavedLocation() ?? (await locateAndSave());
  if (!saved) return undefined;
  return blurPoint(saved, SHARE_PRECISION[level]);
}
