import { describe, expect, it } from "vitest";
import {
  buildPerformanceProfile,
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
});
