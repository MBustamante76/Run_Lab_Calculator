import { describe, expect, it } from "vitest";
import {
  buildPerformanceProfile,
  CLOSE_SCORE_POINTS,
  deriveProfileShape,
  MAX_PROFILE_PERFORMANCES,
  MIN_PROFILE_PERFORMANCES,
  pointsForPerformance,
  worldAthleticsEdition,
} from "../../src/calculation/profile/worldAthleticsPoints";

describe("World Athletics outdoor points", () => {
  it("uses the 2025 revised outdoor edition", () => {
    expect(worldAthleticsEdition).toMatch(/2025/i);
  });

  it("scores Bolt's 9.58 100 m at 1356 points", () => {
    expect(pointsForPerformance("M", "100", 9.58)).toBe(1356);
  });

  it("takes the lower points row when a mark falls between table values", () => {
    const exact = pointsForPerformance("M", "100", 10.85);
    const between = pointsForPerformance("M", "100", 10.855);
    expect(exact).toBeTypeOf("number");
    expect(between).toBeTypeOf("number");
    expect(between!).toBeLessThan(exact!);
  });

  it("ranks the higher-scoring PB as the strongest", () => {
    const profile = buildPerformanceProfile("M", [
      { eventId: "800", milliseconds: 2 * 60 * 1000 + 10 * 1000 },
      { eventId: "5000", milliseconds: 18 * 60 * 1000 + 30 * 1000 },
    ]);
    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }
    expect(profile.value.performances).toHaveLength(2);
    expect(profile.value.performances[0]?.points).toBeGreaterThanOrEqual(
      profile.value.performances[1]?.points ?? 0,
    );
    expect(profile.value.strongestEventId).toBe(profile.value.performances[0]?.eventId);
    expect(profile.value.shapeLabel).toBeTruthy();
    expect(profile.value.interpretation.length).toBeGreaterThan(20);
    expect(profile.value.chartPerformances).toHaveLength(2);
  });

  it("rejects fewer than two performances", () => {
    const profile = buildPerformanceProfile("M", [
      { eventId: "1500", milliseconds: 5 * 60 * 1000 },
    ]);
    expect(profile.ok).toBe(false);
    if (profile.ok) {
      return;
    }
    expect(profile.errors[0]?.message).toMatch(new RegExp(String(MIN_PROFILE_PERFORMANCES)));
  });

  it("rejects more than six performances", () => {
    const profile = buildPerformanceProfile("M", [
      { eventId: "100", milliseconds: 12_000 },
      { eventId: "200", milliseconds: 25_000 },
      { eventId: "400", milliseconds: 55_000 },
      { eventId: "800", milliseconds: 130_000 },
      { eventId: "1500", milliseconds: 270_000 },
      { eventId: "3000", milliseconds: 600_000 },
      { eventId: "5000", milliseconds: 1_000_000 },
    ]);
    expect(profile.ok).toBe(false);
    if (profile.ok) {
      return;
    }
    expect(profile.errors[0]?.message).toMatch(new RegExp(String(MAX_PROFILE_PERFORMANCES)));
  });

  it("rejects duplicate distances", () => {
    const profile = buildPerformanceProfile("W", [
      { eventId: "1500", milliseconds: 5 * 60 * 1000 },
      { eventId: "1500", milliseconds: 4 * 60 * 1000 + 50 * 1000 },
    ]);
    expect(profile.ok).toBe(false);
    if (profile.ok) {
      return;
    }
    expect(profile.errors.some((error) => error.code === "duplicate-event")).toBe(true);
  });

  it("marks top scores within the close-score window as closely matched", () => {
    const shape = deriveProfileShape([
      { eventId: "800", milliseconds: 136_000, points: 880 },
      { eventId: "1500", milliseconds: 284_000, points: 885 },
      { eventId: "5000", milliseconds: 1_052_000, points: 809 },
    ]);
    expect(885 - 880).toBeLessThanOrEqual(CLOSE_SCORE_POINTS);
    expect(shape.closelyMatched).toBe(true);
    expect(shape.leadingEventIds).toEqual(expect.arrayContaining(["800", "1500"]));
    expect(shape.interpretation).toMatch(/closely matched/i);
  });

  it("classifies a clear middle-distance standout", () => {
    const shape = deriveProfileShape([
      { eventId: "800", milliseconds: 136_400, points: 820 },
      { eventId: "1500", milliseconds: 284_200, points: 900 },
      { eventId: "3000", milliseconds: 616_000, points: 830 },
      { eventId: "5000", milliseconds: 1_052_000, points: 780 },
    ]);
    expect(shape.shapeLabel).toBe("Middle-distance focused");
    expect(shape.gaugePosition).toBeCloseTo(0.5, 2);
    expect(shape.interpretation).toMatch(/1500m/i);
    expect(shape.interpretation).toMatch(/middle-distance focused/i);
  });

  it("classifies near-flat scores as balanced", () => {
    const shape = deriveProfileShape([
      { eventId: "800", milliseconds: 130_000, points: 850 },
      { eventId: "1500", milliseconds: 270_000, points: 852 },
      { eventId: "5000", milliseconds: 960_000, points: 848 },
    ]);
    expect(shape.shapeLabel).toBe("Balanced");
    expect(shape.gaugePosition).toBe(0.5);
  });
});
