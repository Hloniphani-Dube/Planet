import { useMemo, useSyncExternalStore } from "react";
import { getShareLevel, subscribeLocation, type SavedLocation, type ShareLevel } from "../lib/location";

function rawLocation(): string {
  try {
    return localStorage.getItem("planet.location") ?? "";
  } catch {
    return "";
  }
}

/** The saved location, kept in step across components and tabs. */
export function useSavedLocation(): SavedLocation | null {
  const raw = useSyncExternalStore(subscribeLocation, rawLocation, () => "");
  return useMemo(() => {
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as SavedLocation;
      return typeof value.lat === "number" && typeof value.lng === "number" ? value : null;
    } catch {
      return null;
    }
  }, [raw]);
}

export function useShareLevel(): ShareLevel {
  return useSyncExternalStore(subscribeLocation, getShareLevel, () => "off" as ShareLevel);
}
