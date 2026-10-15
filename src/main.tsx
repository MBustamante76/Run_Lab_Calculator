import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RunLabCalculatorApp } from "./app/RunLabCalculatorApp";
import { productName } from "./config/brand";
import "./styles/tokens.css";
import "./styles/calculator.css";

const mounts = document.querySelectorAll<HTMLElement>("[data-run-lab-calculator]");

mounts.forEach((mount) => {
  if (mount.dataset.mounted === "true") {
    return;
  }

  mount.dataset.mounted = "true";
  mount.setAttribute("aria-label", productName);
  createRoot(mount).render(
    <StrictMode>
      <RunLabCalculatorApp />
    </StrictMode>,
  );
});
