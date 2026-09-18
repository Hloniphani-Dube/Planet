import { useOnlineStatus } from "../hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="bg-black px-4 py-2 text-center text-sm text-white">
      You're offline. Photos will be diagnosed automatically once you're back online.
    </div>
  );
}
