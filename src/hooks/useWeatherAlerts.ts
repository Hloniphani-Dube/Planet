import { useCallback, useEffect, useMemo, useState } from "react";
import { getForecast, type Forecast } from "../lib/weather";
import { computeAlerts, type WeatherAlert } from "../lib/weatherAlerts";
import { useSavedLocation } from "./useSavedLocation";
import type { Plant } from "../lib/types";

/** A forecast for the saved location, and the alerts it raises for the given plants. */
export function useWeatherAlerts(plants: Plant[] | null) {
  const location = useSavedLocation();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);

  const lat = location?.lat;
  const lng = location?.lng;

  const load = useCallback(
    async (force = false) => {
      if (lat === undefined || lng === undefined) return;
      setLoading(true);
      try {
        setForecast(await getForecast({ lat, lng }, force));
      } finally {
        setLoading(false);
      }
    },
    [lat, lng],
  );

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    let cancelled = false;
    void getForecast({ lat, lng }).then((result) => {
      if (!cancelled) setForecast(result);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const alerts = useMemo<WeatherAlert[]>(
    () => (forecast && plants ? computeAlerts(forecast, plants) : []),
    [forecast, plants],
  );

  return {
    location,
    forecast: location ? forecast : null,
    alerts: location ? alerts : [],
    loading,
    refresh: () => load(true),
  };
}
