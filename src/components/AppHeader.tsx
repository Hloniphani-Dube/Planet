import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LineChart, Menu, RefreshCw, Settings } from "lucide-react";
import { ThemeSegmented, ThemeToggle } from "./ThemeToggle";
import { InstallButton } from "./InstallApp";
import { Sheet } from "./Sheet";
import { TopNav } from "./NavBar";
import { useMode, type AppMode } from "../lib/mode";

function LogoMark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-xl bg-green-700 text-white">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <g transform="translate(12 12) rotate(-45)">
          <path d="M-7.5 0C-3.5-4.8 3.5-4.8 7.5 0C3.5 4.8-3.5 4.8-7.5 0Z" fill="currentColor" />
        </g>
      </svg>
    </span>
  );
}

const menuRow =
  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-black transition-colors hover:bg-neutral-100";

function MoreMenu({ mode, open, onClose }: { mode: AppMode; open: boolean; onClose: () => void }) {
  const { resetMode } = useMode();

  return (
    <Sheet open={open} onClose={onClose} title="Menu">
      <div className="flex flex-col gap-1">
        {mode === "full" && (
          <>
            <NavLink to="/growth" onClick={onClose} className={menuRow}>
              <LineChart size={18} aria-hidden />
              Growth trends
            </NavLink>
            <NavLink to="/settings" onClick={onClose} className={menuRow}>
              <Settings size={18} aria-hidden />
              Settings
            </NavLink>
          </>
        )}
        <InstallButton className={menuRow} />
      </div>

      <div className="mt-4">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Appearance</p>
        <ThemeSegmented />
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            resetMode();
          }}
          className={menuRow}
        >
          <RefreshCw size={18} aria-hidden />
          <span>
            {mode === "demo" ? "Instant demo" : "Full platform"}
            <span className="block text-xs font-normal text-neutral-500">Switch mode</span>
          </span>
        </button>
      </div>
    </Sheet>
  );
}

/** Sticky top bar: brand, desktop navigation, the theme switch and the menu. */
export function AppHeader({ mode }: { mode: AppMode | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-neutral-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Planet-i-Green home">
          <LogoMark />
          <span className="text-base font-semibold tracking-tight text-black">Planet-i-Green</span>
        </Link>

        {mode && <TopNav mode={mode} />}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {mode ? (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex size-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:border-black hover:text-black"
            >
              <Menu size={18} />
            </button>
          ) : (
            // Someone who arrived on a shared report link and hasn't picked a mode yet.
            <Link to="/" className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white">
              Try it
            </Link>
          )}
        </div>
      </div>
      {mode && <MoreMenu mode={mode} open={menuOpen} onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

