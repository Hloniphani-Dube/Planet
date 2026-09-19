import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AiProvider, Diagnosis } from "./types";

/** The most recent scan, kept so the result is still there after a trip to another tab. */
export interface LastScan {
  diagnosis: Diagnosis;
  photo: Blob;
  /** Full mode: the saved report, and how many reminders it created. */
  reportId?: string;
  plantId?: string;
  plantName?: string;
  remindersAdded?: number;
  saveFailed?: boolean;
}

interface SessionValue {
  demoProvider: AiProvider;
  setDemoProvider: (provider: AiProvider) => void;
  /** Held in memory only. Never written to storage; gone on refresh. */
  demoApiKey: string;
  setDemoApiKey: (key: string) => void;
  demoKeyConfirmed: boolean;
  setDemoKeyConfirmed: (confirmed: boolean) => void;
  lastScan: LastScan | null;
  setLastScan: (scan: LastScan | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [demoProvider, setDemoProvider] = useState<AiProvider>("claude");
  const [demoApiKey, setDemoApiKey] = useState("");
  const [demoKeyConfirmed, setDemoKeyConfirmed] = useState(false);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  const value = useMemo<SessionValue>(
    () => ({
      demoProvider,
      setDemoProvider,
      demoApiKey,
      setDemoApiKey,
      demoKeyConfirmed,
      setDemoKeyConfirmed,
      lastScan,
      setLastScan,
    }),
    [demoProvider, demoApiKey, demoKeyConfirmed, lastScan],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
