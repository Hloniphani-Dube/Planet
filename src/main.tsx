import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ModeProvider } from "./lib/mode.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ModeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ModeProvider>
  </StrictMode>,
);
