import { useState } from "react";
import { Download, PlusSquare, Share, X } from "lucide-react";
import { promptInstall, useInstall } from "../lib/install";
import { Sheet } from "./Sheet";

const DISMISS_KEY = "planet.installDismissedAt";
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  try {
    const value = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(value) && Date.now() - value < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** What to do when the browser gives us no install prompt: iPhones and iPads never do,
 * and some desktop browsers only expose it in their menu. */
function InstallInstructions({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { needsIosInstructions } = useInstall();

  return (
    <Sheet open={open} onClose={onClose} title="Install Planet-i-Green">
      {needsIosInstructions ? (
        <ol className="flex flex-col gap-3 text-sm text-neutral-700">
          <li className="flex items-start gap-3">
            <Share size={18} className="mt-0.5 shrink-0 text-neutral-500" />
            <span>
              Tap the <strong>Share</strong> button in Safari's toolbar.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <PlusSquare size={18} className="mt-0.5 shrink-0 text-neutral-500" />
            <span>
              Scroll and choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
            </span>
          </li>
        </ol>
      ) : (
        <p className="text-sm text-neutral-700">
          Open your browser's menu and choose <strong>Install app</strong> (Chrome, Edge) or{" "}
          <strong>Add to Home Screen</strong> (Android, Safari). Once installed, Planet-i-Green opens
          full-screen like any other app and works offline.
        </p>
      )}
    </Sheet>
  );
}

/** Menu row / button that installs the app the best way the current browser allows. */
export function InstallButton({ className = "" }: { className?: string }) {
  const install = useInstall();
  const [help, setHelp] = useState(false);

  if (install.installed) return null;

  async function handleClick() {
    if (install.canPrompt) {
      await promptInstall();
    } else {
      setHelp(true);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        <Download size={18} aria-hidden />
        <span>Install app</span>
      </button>
      <InstallInstructions open={help} onClose={() => setHelp(false)} />
    </>
  );
}

/** A dismissible nudge on phones, shown only where installing is actually possible. */
export function InstallBanner() {
  const install = useInstall();
  const [dismissed, setDismissed] = useState(recentlyDismissed);
  const [help, setHelp] = useState(false);

  if (install.installed || dismissed || (!install.canPrompt && !install.needsIosInstructions)) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Not persisted; it will reappear next visit, which is acceptable.
    }
    setDismissed(true);
  }

  async function handleInstall() {
    if (install.canPrompt) await promptInstall();
    else setHelp(true);
  }

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-3 md:hidden">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
        <Download size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-black">Install Planet-i-Green</p>
        <p className="text-xs text-neutral-600">Quick access from your home screen, and it works offline.</p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex size-7 items-center justify-center rounded-full text-neutral-500 hover:bg-green-100"
      >
        <X size={16} />
      </button>
      <InstallInstructions open={help} onClose={() => setHelp(false)} />
    </div>
  );
}
