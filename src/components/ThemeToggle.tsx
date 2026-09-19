import { Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../lib/theme";

/** A sliding light/dark switch. One tap flips whichever theme is showing. */
export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={toggle}
      className="relative h-8 w-14 shrink-0 rounded-full border border-neutral-300 bg-neutral-100 transition-colors hover:border-neutral-400"
    >
      <Sun
        size={14}
        strokeWidth={2}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-700"
        aria-hidden
      />
      <Moon
        size={14}
        strokeWidth={2}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500"
        aria-hidden
      />
      <span
        className={`absolute top-0.5 flex size-7 items-center justify-center rounded-full bg-black text-white shadow transition-transform duration-300 ease-out ${
          dark ? "translate-x-6" : "translate-x-0.5"
        }`}
      >
        {dark ? <Moon size={14} strokeWidth={2} aria-hidden /> : <Sun size={14} strokeWidth={2} aria-hidden />}
      </span>
    </button>
  );
}

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

/** Light / Dark / Auto (follow the device), for settings and the menu. */
export function ThemeSegmented() {
  const { preference, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={preference === option.value}
          onClick={() => setPreference(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            preference === option.value
              ? "bg-white text-black shadow-sm"
              : "text-neutral-500 hover:text-black"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
