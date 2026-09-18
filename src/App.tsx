import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { OfflineBanner } from "./components/OfflineBanner";
import { MissingConfig } from "./components/MissingConfig";
import { IntroPage } from "./pages/IntroPage";
import { DiagnosePage } from "./pages/DiagnosePage";
import { CareCalendarPage } from "./pages/CareCalendarPage";
import { CommunityPage } from "./pages/CommunityPage";
import { GrowthPage } from "./pages/GrowthPage";
import { SettingsPage } from "./pages/SettingsPage";
import { isSupabaseConfigured } from "./lib/supabase";
import { watchConnectivityAndSync } from "./lib/sync";
import { useMode, type AppMode } from "./lib/mode";

function ModeBadge({ mode, onReset }: { mode: AppMode; onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="whitespace-nowrap rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-black hover:text-black"
    >
      {mode === "demo" ? "Demo mode" : "Full platform"}, switch
    </button>
  );
}

function App() {
  const { mode, resetMode } = useMode();

  useEffect(() => {
    if (mode !== "full" || !isSupabaseConfigured) return;
    return watchConnectivityAndSync();
  }, [mode]);

  // Only the full platform depends on Supabase. The demo runs entirely in the browser
  // against a visitor-supplied API key, so it works with no backend configured at all.
  if (!mode) {
    return <IntroPage />;
  }

  if (mode === "full" && !isSupabaseConfigured) {
    return <MissingConfig />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-white pb-16 sm:pb-0">
      <OfflineBanner />
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:hidden">
        <span className="text-lg font-semibold tracking-tight text-black">PLANET</span>
        <ModeBadge mode={mode} onReset={resetMode} />
      </header>
      <div className="hidden items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 sm:flex">
        <span className="text-lg font-semibold tracking-tight text-black">PLANET</span>
        <div className="flex items-center gap-6">
          {mode === "full" && <NavBar />}
          <ModeBadge mode={mode} onReset={resetMode} />
        </div>
      </div>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DiagnosePage />} />
          {mode === "full" && (
            <>
              <Route path="/calendar" element={<CareCalendarPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/growth" element={<GrowthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {mode === "full" && (
        <div className="sm:hidden">
          <NavBar />
        </div>
      )}
    </div>
  );
}

export default App;
