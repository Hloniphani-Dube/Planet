import type { ReactNode } from "react";
import { Droplets, Snowflake, Sun, Thermometer, type LucideIcon } from "lucide-react";
import type { CareProfile, LightNeed } from "../lib/types";

export const LIGHT_LABELS: Record<LightNeed, string> = {
  low: "Low light",
  medium: "Medium light",
  bright: "Bright, indirect",
  full_sun: "Full sun",
};

const SOURCE_NOTES: Record<CareProfile["source"], string> = {
  reference: "From our plant reference",
  ai: "Estimated by the AI from your photo",
  default: "General defaults, scan again to refine",
};

function waterLabel(days: number): string {
  if (days <= 1) return "Daily";
  return `Every ${days} days`;
}

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
      <Icon size={13} strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

/** Compact one-row summary, used inside the diagnosis card. */
export function CareProfileChips({ profile }: { profile: CareProfile }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Chip icon={Sun}>{LIGHT_LABELS[profile.light]}</Chip>
      <Chip icon={Droplets}>{waterLabel(profile.waterEveryDays)}</Chip>
      <Chip icon={Thermometer}>
        {Math.round(profile.minTempC)} to {Math.round(profile.maxTempC)}°C
      </Chip>
      {profile.frostSensitive && <Chip icon={Snowflake}>Frost-sensitive</Chip>}
    </div>
  );
}

/** Larger tiles, used on a plant's own page. */
export function CareProfileCard({ profile }: { profile: CareProfile }) {
  const tiles: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Sun, label: "Light", value: LIGHT_LABELS[profile.light] },
    { icon: Droplets, label: "Water", value: waterLabel(profile.waterEveryDays) },
    {
      icon: Thermometer,
      label: "Comfortable range",
      value: `${Math.round(profile.minTempC)} to ${Math.round(profile.maxTempC)}°C`,
    },
    {
      icon: Snowflake,
      label: "Frost",
      value: profile.frostSensitive ? "Sensitive, protect it" : "Tolerates light frost",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 p-3">
            <p className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Icon size={13} aria-hidden />
              {label}
            </p>
            <p className="mt-0.5 text-sm font-medium text-black">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-400">{SOURCE_NOTES[profile.source]}</p>
    </div>
  );
}
