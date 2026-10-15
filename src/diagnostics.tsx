import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EngineDiagnostics } from "./dev/EngineDiagnostics";
import "./dev/diagnostics.css";

const mount = document.querySelector<HTMLElement>("#engine-diagnostics");

if (mount) {
  createRoot(mount).render(
    <StrictMode>
      <EngineDiagnostics />
    </StrictMode>,
  );
}
