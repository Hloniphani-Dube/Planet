import type { WeatherContext } from "./types";

function getCoords(): Promise<GeolocationCoordinates | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}

/** Returns null if permission is denied, geolocation is unsupported, or the request fails.
 * Callers should treat weather as an optional enhancement, never a blocker. */
export async function getLocalWeather(): Promise<WeatherContext | null> {
  const coords = await getCoords();
  if (!coords) return null;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", coords.latitude.toString());
    url.searchParams.set("longitude", coords.longitude.toString());
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m");

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const tempC = data?.current?.temperature_2m;
    const humidity = data?.current?.relative_humidity_2m;
    if (typeof tempC !== "number" || typeof humidity !== "number") return null;

    return {
      tempC,
      humidity,
      description: `${tempC}°C, ${humidity}% humidity`,
      lat: coords.latitude,
      lng: coords.longitude,
    };
  } catch {
    return null;
  }
}
