import { getDevicePosition, getSavedLocation } from "./location";
import type { LatLng } from "./geo";
import type { WeatherContext } from "./types";

export interface DayForecast {
  /** Local date, YYYY-MM-DD. */
  date: string;
  maxC: number;
  minC: number;
  /** Lowest temperature from 18:00 this evening to 08:00 tomorrow morning: the night that
   * frost actually happens in. Null when the hourly data doesn't cover it. */
  nightMinC: number | null;
  precipMm: number;
  precipProbability: number;
  weatherCode: number;
}

export interface Forecast {
  fetchedAt: number;
  lat: number;
  lng: number;
  current?: { tempC: number; humidity: number };
  days: DayForecast[];
}

const CACHE_KEY = "planet.forecast";
const CACHE_TTL_MS = 60 * 60 * 1000;

function readCache(lat: number, lng: number): Forecast | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Forecast;
    // Same place, within about 1 km.
    if (Math.abs(cached.lat - lat) > 0.01 || Math.abs(cached.lng - lng) > 0.01) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCache(forecast: Forecast): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(forecast));
  } catch {
    // Caching is a nicety.
  }
}

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; relative_humidity_2m?: number };
  hourly?: { time: string[]; temperature_2m: (number | null)[] };
  daily?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max: (number | null)[];
    weather_code: (number | null)[];
  };
}

function nightMinimum(
  hourly: NonNullable<OpenMeteoResponse["hourly"]>,
  date: string,
  nextDate: string | undefined,
): number | null {
  if (!nextDate) return null;
  let min: number | null = null;
  hourly.time.forEach((time, i) => {
    const temp = hourly.temperature_2m[i];
    if (temp === null || temp === undefined) return;
    const day = time.slice(0, 10);
    const hour = Number(time.slice(11, 13));
    const inNight = (day === date && hour >= 18) || (day === nextDate && hour <= 8);
    if (inNight && (min === null || temp < min)) min = temp;
  });
  return min;
}

/** A 7-day forecast from Open-Meteo (no API key). Cached for an hour, and a stale cache is
 * returned if the network fails, so alerts still show on a patchy connection. */
export async function getForecast(location: LatLng, force = false): Promise<Forecast | null> {
  const cached = readCache(location.lat, location.lng);
  if (cached && !force && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", location.lat.toFixed(3));
    url.searchParams.set("longitude", location.lng.toFixed(3));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m");
    url.searchParams.set("hourly", "temperature_2m");
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code",
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "8");

    const res = await fetch(url);
    if (!res.ok) return cached;
    const data = (await res.json()) as OpenMeteoResponse;
    if (!data.daily) return cached;

    const { daily } = data;
    // Drop the eighth day; it only exists so the seventh night has data.
    const days: DayForecast[] = daily.time.slice(0, 7).map((date, i) => ({
      date,
      maxC: daily.temperature_2m_max[i] ?? 0,
      minC: daily.temperature_2m_min[i] ?? 0,
      nightMinC: data.hourly ? nightMinimum(data.hourly, date, daily.time[i + 1]) : null,
      precipMm: daily.precipitation_sum[i] ?? 0,
      precipProbability: daily.precipitation_probability_max[i] ?? 0,
      weatherCode: daily.weather_code[i] ?? 0,
    }));

    const forecast: Forecast = {
      fetchedAt: Date.now(),
      lat: location.lat,
      lng: location.lng,
      current:
        typeof data.current?.temperature_2m === "number" &&
        typeof data.current?.relative_humidity_2m === "number"
          ? { tempC: data.current.temperature_2m, humidity: data.current.relative_humidity_2m }
          : undefined,
      days,
    };
    writeCache(forecast);
    return forecast;
  } catch {
    return cached;
  }
}

/** Short plain-text summary of the next couple of days, for the AI prompt and the UI. */
export function describeUpcoming(forecast: Forecast): string {
  const tonight = forecast.days[0]?.nightMinC;
  const parts: string[] = [];
  if (typeof tonight === "number") parts.push(`overnight low tonight ${Math.round(tonight)}°C`);
  const tomorrow = forecast.days[1];
  if (tomorrow) parts.push(`tomorrow ${Math.round(tomorrow.minC)} to ${Math.round(tomorrow.maxC)}°C`);
  return parts.join(", ");
}

/** Returns null if there's no saved location and permission is denied/unsupported, or the
 * request fails. Callers should treat weather as an optional enhancement, never a
 * blocker. Prefers the saved location, so a saved place never triggers a permission prompt. */
export async function getLocalWeather(): Promise<WeatherContext | null> {
  const saved = getSavedLocation();
  const position = saved ?? (await getDevicePosition(8000));
  if (!position) return null;

  const forecast = await getForecast(position);
  if (!forecast?.current) return null;

  const { tempC, humidity } = forecast.current;
  const upcoming = describeUpcoming(forecast);
  // Rounded to about 11 km so the AI provider gets a region, not an address.
  const region = `approximate location ${position.lat.toFixed(1)}, ${position.lng.toFixed(1)}`;
  const place = saved && saved.source === "search" ? `${saved.label} (${region})` : region;

  return {
    tempC,
    humidity,
    description: `${tempC}°C, ${humidity}% humidity${upcoming ? `; ${upcoming}` : ""}; ${place}`,
    lat: position.lat,
    lng: position.lng,
  };
}
