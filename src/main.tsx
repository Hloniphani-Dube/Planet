import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ModeProvider } from "./lib/mode.tsx";
import { SessionProvider } from "./lib/session.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import { initInstallPrompt } from "./lib/install.ts";

// The browser fires its install event once, early; listen before React mounts.
initInstallPrompt();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ModeProvider>
        <SessionProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SessionProvider>
      </ModeProvider>
    </ThemeProvider>
  </StrictMode>,
);
