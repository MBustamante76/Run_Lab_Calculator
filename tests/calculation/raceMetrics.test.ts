import { describe, expect, it } from "vitest";
import { engineDiagnosticsLines } from "../../src/calculation/diagnosticsReport";
import { eventById } from "../../src/calculation/events";
import { formatPace, formatPercentage, formatSpeed, formatSplit } from "../../src/calculation/formatting";
import { calculateRaceMetrics } from "../../src/calculation/raceMetrics";
import { parseStructuredTime } from "../../src/calculation/time";

function metricsFor(eventId: string, minutes: number, seconds: number) {
  const parsed = parseStructuredTime({ minutes, seconds });
  if (!parsed.ok) {
    throw new Error("Expected a valid time.");
  }
  const result = calculateRaceMetrics(eventById(eventId).metres, parsed.value.milliseconds);
  if (!result.ok) {
    throw new Error("Expected valid metrics.");
  }
  return result.value;
}

describe("race metrics", () => {
  it("calculates 5000 m in 20:00", () => {
    const metrics = metricsFor("5000", 20, 0);
    expect(metrics.totalTimeMilliseconds).toBe(1_200_000);
    expect(formatPace(metrics.pacePerKilometreMilliseconds)).toBe("4:00");
    expect(formatPace(metrics.pacePerMileMilliseconds)).toBe("6:26");
    expect(formatSpeed(metrics.speedKilometresPerHour)).toBe("15.00");
    expect(metrics.rhythms.map((rhythm) => rhythm.metres)).toEqual([400]);
    expect(formatSplit(metrics.rhythms[0]?.milliseconds ?? 0)).toBe("1:36.0");
  });

  it("calculates 800 m in 2:00", () => {
    const metrics = metricsFor("800", 2, 0);
    const byDistance = new Map(metrics.rhythms.map((rhythm) => [rhythm.metres, rhythm.milliseconds]));
    expect(formatSplit(byDistance.get(100) ?? 0)).toBe("15.0");
    expect(formatSplit(byDistance.get(200) ?? 0)).toBe("30.0");
    expect(formatSplit(byDistance.get(400) ?? 0)).toBe("1:00.0");
  });

  it("uses the mile constant for mile pace", () => {
    const metrics = metricsFor("mile", 4, 0);
    expect(metrics.pacePerMileMilliseconds).toBe(240_000);
    expect(formatPace(metrics.pacePerMileMilliseconds)).toBe("4:00");
  });

  it("returns the same metrics for the same input", () => {
    const first = metricsFor("5000", 20, 0);
    const second = metricsFor("5000", 20, 0);
    expect(second).toEqual(first);
  });

  it("formats percentages to two decimals", () => {
    expect(formatPercentage(15.2)).toBe("15.20%");
  });

  it("reports the checkpoint fixtures", () => {
    const lines = engineDiagnosticsLines();
    expect(lines).toContain("mile | 1 Mile | 1609.344 m | middle | predict, pace, finish | splits 400 | route middle");
    expect(lines).toContain("Total time: 1200 s");
    expect(lines).toContain("Pace per km: 4:00");
    expect(lines).toContain("Pace per mile: 6:26");
    expect(lines).toContain("Speed: 15.00 km/h");
    expect(lines).toContain("Average 400 m: 1:36.0");
    expect(lines).toContain("Average 100 m: 15.0");
    expect(lines).toContain("Average 200 m: 30.0");
    expect(lines).toContain("Average 400 m: 1:00.0");
    expect(lines).toContain("Invalid seconds: Seconds must be less than 60.");
    expect(lines).toContain("Rounding carry: 1:00.0");
    expect(lines.join("\n")).not.toContain(":60");
  });
});
