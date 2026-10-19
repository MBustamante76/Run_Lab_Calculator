import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";

const hostileTheme = `
  h1, h2, h3 { color: #ff00aa; font-size: 12px; letter-spacing: 0; text-transform: none; }
  button { background: #ff00aa; color: #00ff00; border-radius: 0; min-height: 10px; font-family: "Comic Sans MS", cursive; }
  input, select { background: #ff00aa; color: #00ff00; border: 4px solid #ff00aa; width: 40px; }
  p, label { color: #ff00aa; font-size: 8px; }
`;

function colour(element: Element, property: string): string {
  return getComputedStyle(element).getPropertyValue(property);
}

describe("theme isolation", () => {
  it("keeps calculator controls recognisable under conflicting element styles", () => {
    const style = document.createElement("style");
    style.textContent = `${readFileSync("src/styles/tokens.css", "utf8")}\n${readFileSync("src/styles/calculator.css", "utf8")}\n${hostileTheme}`;
    document.head.appendChild(style);

    render(
      <div className="run-lab-calculator">
        <RunLabCalculatorApp />
      </div>,
    );

    const heading = screen.getByRole("heading", { name: /know your pace/i });
    const panelHeading = screen.getByRole("heading", { name: "Predict my times at other distances" });
    const workspaceHeading = screen.getByRole("heading", { name: "I want to…" });
    const calculate = screen.getByRole("button", { name: "Calculate my result" });
    const distance = screen.getByLabelText("PB distance");

    expect(colour(heading, "color")).toBe("var(--color-text)");
    expect(colour(heading, "text-transform")).toBe("uppercase");
    expect(colour(panelHeading, "color")).toBe("var(--color-text)");
    expect(colour(workspaceHeading, "color")).toBe("var(--color-white)");
    expect(colour(calculate, "background")).toContain("--color-accent");
    expect(colour(calculate, "color")).toBe("rgb(17, 17, 17)");
    expect(colour(calculate, "min-height")).toBe("48px");
    expect(colour(distance, "background")).toContain("--color-white");
    expect(colour(distance, "color")).toBe("var(--color-text)");
    expect(colour(distance, "width")).toBe("100%");

    style.remove();
  });

  it("does not ship the isolation page in the plugin", () => {
    const packager = readFileSync("scripts/package-plugin.mjs", "utf8");
    const plugin = readFileSync("wordpress/run-lab-calculator/run-lab-calculator.php", "utf8");
    expect(packager).not.toContain("isolation.html");
    expect(plugin).not.toContain("isolation.html");
    expect(readFileSync("isolation.html", "utf8")).toContain("Development only");
  });
});
