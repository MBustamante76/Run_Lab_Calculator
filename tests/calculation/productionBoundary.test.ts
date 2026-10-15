import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production boundary", () => {
  it("does not import the diagnostics page from the plugin entry", () => {
    const source = readFileSync("src/main.tsx", "utf8");
    expect(source).not.toContain("diagnostics");
    expect(source).not.toContain("calculateRaceMetrics");
  });
});
