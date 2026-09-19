import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { Forecast } from "../lib/weather";
import type { WeatherAlert } from "../lib/weatherAlerts";

function iconFor(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return Snowflake;
  if (code >= 95) return CloudLightning;
  if (code >= 51) return CloudRain;
  return Cloud;
}

/** Seven days at a glance, with a dot under any day that raises an alert for your plants. */
export function ForecastStrip({ forecast, alerts }: { forecast: Forecast; alerts: WeatherAlert[] }) {
  return (
    <ol className="grid grid-cols-7 gap-1 rounded-2xl border border-neutral-200 p-2" aria-label="Seven day forecast">
      {forecast.days.map((day, i) => {
        const Icon = iconFor(day.weatherCode);
        const dayAlerts = alerts.filter((a) => a.date === day.date);
        const warning = dayAlerts.some((a) => a.level === "warning");
        const weekday =
          i === 0
            ? "Today"
            : new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });

        return (
          <li key={day.date} className="flex flex-col items-center gap-0.5 py-1 text-center">
            <span className="text-[10px] font-medium text-neutral-500">{weekday}</span>
            <Icon size={18} className="text-neutral-600" aria-hidden />
            <span className="text-xs font-semibold text-black">{Math.round(day.maxC)}°</span>
            <span className="text-[10px] text-neutral-400">{Math.round(day.minC)}°</span>
            <span
              className={`mt-0.5 size-1.5 rounded-full ${
                dayAlerts.length === 0 ? "bg-transparent" : warning ? "bg-red-500" : "bg-amber-500"
              }`}
              aria-label={dayAlerts.length ? `${dayAlerts.length} alert${dayAlerts.length === 1 ? "" : "s"}` : undefined}
            />
          </li>
        );
      })}
    </ol>
  );
}
