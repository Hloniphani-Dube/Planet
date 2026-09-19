import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

/** Re-renders with fresh results whenever the underlying IndexedDB tables change, so a
 * completed reminder (or one created elsewhere in the app) shows up without a manual refresh.
 * `undefined` until the first result arrives. */
export function useLiveQuery<T>(query: () => Promise<T>): T | undefined {
  const [result, setResult] = useState<T>();

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: setResult,
      error: (err) => console.error("Live query failed", err),
    });
    return () => subscription.unsubscribe();
    // The query is expected to be a stable module-level function or wrapped by the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return result;
}
