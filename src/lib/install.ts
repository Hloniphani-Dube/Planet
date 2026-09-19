import { useSyncExternalStore } from "react";

/** Chromium's "install this app" event. It fires once, early, so it is captured at module
 * load (imported from main.tsx) rather than waiting for a component to mount. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
let snapshot = computeSnapshot();

export interface InstallState {
  /** The browser can show its native install prompt right now. */
  canPrompt: boolean;
  /** Already running as an installed app. */
  installed: boolean;
  /** iPhone/iPad Safari: no prompt exists, so we show Share-sheet instructions instead. */
  needsIosInstructions: boolean;
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

function computeSnapshot(): InstallState {
  const standalone = typeof window !== "undefined" && (installed || isStandalone());
  return {
    canPrompt: !standalone && deferredPrompt !== null,
    installed: standalone,
    needsIosInstructions: typeof window !== "undefined" && !standalone && isIos(),
  };
}

function emit(): void {
  snapshot = computeSnapshot();
  listeners.forEach((listener) => listener());
}

export function initInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    emit();
  });
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  const event = deferredPrompt;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // The event can only be used once.
  deferredPrompt = null;
  if (outcome === "accepted") installed = true;
  emit();
  return outcome;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstall(): InstallState {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}
