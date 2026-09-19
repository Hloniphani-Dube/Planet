import { useEffect } from "react";
import { matchPath, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/NavBar";
import { OfflineBanner } from "./components/OfflineBanner";
import { MissingConfig } from "./components/MissingConfig";
import { IntroPage } from "./pages/IntroPage";
import { DiagnosePage } from "./pages/DiagnosePage";
import { PlantsPage } from "./pages/PlantsPage";
import { PlantDetailPage } from "./pages/PlantDetailPage";
import { CareCalendarPage } from "./pages/CareCalendarPage";
import { CommunityPage } from "./pages/CommunityPage";
import { GrowthPage } from "./pages/GrowthPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ExplorePage } from "./pages/ExplorePage";
import { PlantGuideDetailPage } from "./pages/PlantGuideDetailPage";
import { ReportPage } from "./pages/ReportPage";
import { isSupabaseConfigured } from "./lib/supabase";
import { watchConnectivityAndSync } from "./lib/sync";
import { useMode } from "./lib/mode";

/** New pages should open at the top, not wherever the last one was scrolled to. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const { mode } = useMode();
  const { pathname } = useLocation();

  useEffect(() => {
    if (mode !== "full" || !isSupabaseConfigured) return;
    return watchConnectivityAndSync();
  }, [mode]);

  // A shared report link works for anyone, including someone who hasn't picked a mode yet.
  // Reports are public, so this needs Supabase but not a session choice.
  const publicReport = !mode && isSupabaseConfigured && matchPath("/report/:id", pathname);

  // Only the full platform depends on Supabase. The demo runs entirely in the browser
  // against a visitor-supplied API key, so it works with no backend configured at all.
  if (!mode && !publicReport) {
    return <IntroPage />;
  }

  if (mode === "full" && !isSupabaseConfigured) {
    return <MissingConfig />;
  }

  const effectiveMode = mode ?? "demo";

  return (
    <div className="flex min-h-svh flex-col bg-page pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <ScrollToTop />
      <OfflineBanner />
      <AppHeader mode={effectiveMode} />
      <motion.main
        key={pathname}
        className="flex-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes>
          <Route path="/" element={<DiagnosePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/plants/:slug" element={<PlantGuideDetailPage />} />
          {(mode === "full" || publicReport) && <Route path="/report/:id" element={<ReportPage />} />}
          {mode === "full" && (
            <>
              <Route path="/plants" element={<PlantsPage />} />
              <Route path="/plants/:id" element={<PlantDetailPage />} />
              <Route path="/calendar" element={<CareCalendarPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/growth" element={<GrowthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.main>
      {mode && <BottomNav mode={mode} />}
    </div>
  );
}

export default App;
