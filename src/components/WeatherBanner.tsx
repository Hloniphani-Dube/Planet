import { useState } from "react";
import { Link } from "react-router-dom";
import { CloudRain, Flame, MapPin, Snowflake, Thermometer, X, type LucideIcon } from "lucide-react";
import { useMyPlants } from "../hooks/useMyPlants";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import { digestAlerts, digestSignature, type AlertKind } from "../lib/weatherAlerts";

export const ALERT_ICONS: Record<AlertKind, LucideIcon> = {
  frost: Snowflake,
  cold: Thermometer,
  heat: Flame,
  heavy_rain: CloudRain,
};

const DISMISS_KEY = "planet.digestDismissed";
const LOCATION_NUDGE_KEY = "planet.locationNudgeDismissed";

function readKey(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeKey(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Dismissal just won't persist.
  }
}

/** The daily digest: the alerts for tonight and tomorrow, as one small banner. Stays quiet
 * when the forecast is fine. Dismissing it hides it for today, and it returns if the
 * forecast changes. */
export function WeatherBanner() {
  const { plants } = useMyPlants();
  const { location, alerts } = useWeatherAlerts(plants);
  const [dismissedSignature, setDismissedSignature] = useState(() => readKey(DISMISS_KEY));
  const [nudgeDismissed, setNudgeDismissed] = useState(() => readKey(LOCATION_NUDGE_KEY) === "1");

  if (!plants || plants.length === 0) return null;

  if (!location) {
    if (nudgeDismissed) return null;
    return (
      <div className="mx-auto mt-3 flex w-full max-w-lg items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
        <MapPin size={18} className="shrink-0 text-neutral-500" aria-hidden />
        <p className="flex-1 text-xs text-neutral-600">
          Set your location to get frost, heat and heavy-rain alerts for your plants.{" "}
          <Link to="/settings#location" className="font-semibold text-black underline">
            Set location
          </Link>
        </p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            writeKey(LOCATION_NUDGE_KEY, "1");
            setNudgeDismissed(true);
          }}
          className="text-neutral-400 hover:text-black"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  const digest = digestAlerts(alerts);
  if (digest.length === 0) return null;

  const signature = digestSignature(digest);
  if (dismissedSignature === signature) return null;

  const top = digest[0];
  const Icon = ALERT_ICONS[top.kind];
  const warning = top.level === "warning";

  return (
    <div
      role="status"
      className={`mx-auto mt-3 w-full max-w-lg rounded-2xl border p-3.5 ${
        warning ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
            warning ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-black">{top.title}</p>
          <p className="mt-0.5 text-xs text-neutral-700">{top.advice}</p>
          <p className="mt-1.5 text-xs text-neutral-500">{top.plants.map((p) => p.name).join(", ")}</p>
          {digest.length > 1 && (
            <p className="mt-1.5 text-xs text-neutral-500">
              Plus {digest.length - 1} more.{" "}
              <Link to="/calendar" className="font-semibold text-black underline">
                See the week
              </Link>
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss for today"
          onClick={() => {
            writeKey(DISMISS_KEY, signature);
            setDismissedSignature(signature);
          }}
          className="text-neutral-400 hover:text-black"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
