import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useMode } from "../lib/mode";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { mode } = useMode();
  if (online) return null;

  return (
    <div role="status" className="bg-black px-4 py-2 text-center text-sm text-white">
      {mode === "demo"
        ? "You're offline. Diagnosing needs a connection, but the plant guide still works."
        : "You're offline. Photos will be diagnosed automatically once you're back online."}
    </div>
  );
}
