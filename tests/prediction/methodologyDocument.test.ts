import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { events } from "../../src/calculation/events";
import { predictPerformance } from "../../src/calculation/prediction/PredictionEngine";
import { predictionConfig } from "../../src/calculation/prediction/predictionConfig";
import { unsupportedMessage } from "../../src/calculation/prediction/UnsupportedPredictionStrategy";
import { middle800, pb1500, pb5000, sprint100, sprint200 } from "./fixtures";

const document = readFileSync("docs/tool-01-methodology-review.md", "utf8");

function outcome(performances: Parameters<typeof predictPerformance>[0]["performances"], targetEventId: string) {
  const result = predictPerformance({ performances, targetEventId });
  return result.status === "success" ? result.displayTime : "Unsupported";
}

describe("methodology document", () => {
  it("matches the six example cases produced by the approved configuration", () => {
    const rows = [
      ["A", outcome([sprint200, middle800], "400")],
      ["B", outcome([sprint200, middle800], "600")],
      ["C", outcome([sprint200, middle800], "5000")],
      ["D", outcome([pb1500], "3000")],
      ["E", outcome([pb5000], "10k")],
      ["F", outcome([sprint100], "10k")],
    ] as const;

    expect(rows.map(([, value]) => value)).toEqual([
      "57.0",
      "1:32.3",
      "Unsupported",
      "9:22.9",
      "37:31.7",
      "Unsupported",
    ]);

    for (const [caseId, value] of rows) {
      const line = document.split("\n").find((row) => row.startsWith(`| ${caseId} |`));
      expect(line, `case ${caseId}`).toContain(`**${value}**`);
    }
  });

  it("matches the single-PB routing matrix", () => {
    for (const source of events) {
      const line = document.split("\n").find((row) => row.startsWith(`| ${source.label} |`));
      expect(line, source.label).toBeDefined();
      const cells = (line ?? "").split("|").slice(2, -1).map((cell) => cell.trim());

      const expected = events.map((target) => {
        if (target.id === source.id) {
          return "—";
        }
        const result = predictPerformance({
          performances: [{ eventId: source.id, milliseconds: 100_000 }],
          targetEventId: target.id,
        });
        return result.status === "success" ? "P" : "U";
      });

      expect(cells, source.label).toEqual(expected);
    }
  });

  it("records the approved limits, labels and copy used in code", () => {
    const { interpolation, powerLaw } = predictionConfig;
    expect(document).toContain("Status: **approved by RUN-LAB on 15 October 2026.**");
    expect(document).toContain(`Maximum anchor ratio: **${interpolation.maximumAnchorRatio}**`);
    expect(document).toContain(`Maximum distance ratio: **${powerLaw.maximumDistanceRatio}**`);
    expect(document).toContain(`Exponent: **${powerLaw.exponent}**`);
    expect(document).toContain(`Version: \`${powerLaw.version}\``);
    expect(document).toContain(`Version: \`${interpolation.version}\``);
    expect(document).toContain(`User-facing label: "${interpolation.label}"`);
    expect(document).toContain(`User-facing label: "${powerLaw.label}"`);
    expect(document).toContain(unsupportedMessage);
  });
});
