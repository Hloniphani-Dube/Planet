import { useCallback, useEffect, useState } from "react";
import { listPlants } from "../lib/plants";
import type { Plant } from "../lib/types";

/** The current person's plants. `plants` is null until the first load finishes. */
export function useMyPlants() {
  const [plants, setPlants] = useState<Plant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPlants(await listPlants());
      setError(null);
    } catch (err) {
      console.error("Failed to load plants", err);
      setError("Couldn't load your plants.");
      setPlants((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    // Loads once on mount; state is set after the await.
    void refresh();
  }, [refresh]);

  return { plants, error, refresh };
}
