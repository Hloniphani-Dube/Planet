import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AppMode = "demo" | "full";

const STORAGE_KEY = "planet.mode";

export function getStoredMode(): AppMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "demo" || value === "full" ? value : null;
  } catch {
    return null;
  }
}

function persistMode(mode: AppMode | null): void {
  try {
    if (mode) localStorage.setItem(STORAGE_KEY, mode);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private browsing, storage blocked). Mode just
    // won't persist across reloads, which is a minor inconvenience, not a failure.
  }
}

interface ModeContextValue {
  mode: AppMode | null;
  chooseMode: (mode: AppMode) => void;
  resetMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode | null>(() => getStoredMode());

  const value = useMemo<ModeContextValue>(
    () => ({
      mode,
      chooseMode: (next) => {
        persistMode(next);
        setMode(next);
      },
      resetMode: () => {
        persistMode(null);
        setMode(null);
      },
    }),
    [mode],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within a ModeProvider");
  return ctx;
}
