import { describe, expect, it } from "vitest";
import { predictPerformance } from "../../src/calculation/prediction/PredictionEngine";
import { interpolateTime } from "../../src/calculation/prediction/TwoPbInterpolationStrategy";
import { unsupportedMessage } from "../../src/calculation/prediction/UnsupportedPredictionStrategy";
import { middle800, sprint200 } from "./fixtures";

const first = { metres: 200, milliseconds: 25_000 };
const second = { metres: 800, milliseconds: 130_000 };

describe("two-PB interpolation", () => {
  it("returns each anchor at its own distance", () => {
    expect(interpolateTime(first, second, 200)).toBeCloseTo(25_000, 6);
    expect(interpolateTime(first, second, 800)).toBeCloseTo(130_000, 6);
  });

  it("rises steadily between the anchors", () => {
    let previous = interpolateTime(first, second, 200);
    for (let metres = 250; metres <= 800; metres += 50) {
      const next = interpolateTime(first, second, metres);
      expect(next).toBeGreaterThan(previous);
      previous = next;
    }
  });

  it("gives the same answer whichever PB is entered first", () => {
    expect(interpolateTime(second, first, 400)).toBeCloseTo(interpolateTime(first, second, 400), 6);

    const forward = predictPerformance({ performances: [sprint200, middle800], targetEventId: "400" });
    const reversed = predictPerformance({ performances: [middle800, sprint200], targetEventId: "400" });
    expect(forward.status === "success" && reversed.status === "success").toBe(true);
    if (forward.status === "success" && reversed.status === "success") {
      expect(reversed.predictedTimeMilliseconds).toBe(forward.predictedTimeMilliseconds);
    }
  });

  it("uses 200m and 800m as anchors for 400m and 600m", () => {
    for (const [targetEventId, displayTime] of [
      ["400", "57.0"],
      ["600", "1:32.3"],
    ] as const) {
      const result = predictPerformance({ performances: [sprint200, middle800], targetEventId });
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.methodId).toBe("two-pb-interpolation");
        expect(result.methodLabel).toBe("Based on your two PBs");
        expect(result.methodVersion).toBe("1.0.0");
        expect(result.displayTime).toBe(displayTime);
        expect(result.sourcePerformances).toEqual([sprint200, middle800]);
        expect(result.explanation).toContain("200m PB of 25.0");
        expect(result.explanation).toContain("800m PB of 2:10.0");
        expect(result.warnings).toEqual([]);
      }
    }
  });

  it("allows anchors exactly four times apart and refuses anchors further apart", () => {
    const pb1000 = { eventId: "1000", milliseconds: 170_000 };
    expect(predictPerformance({ performances: [sprint200, middle800], targetEventId: "400" }).status).toBe("success");
    expect(predictPerformance({ performances: [sprint200, pb1000], targetEventId: "400" }).status).toBe("unsupported");
    expect(
      predictPerformance({
        performances: [sprint200, { eventId: "1500", milliseconds: 270_000 }],
        targetEventId: "800",
      }).status,
    ).toBe("unsupported");
  });

  it("does not extend the 200m and 800m relationship to 5000m", () => {
    const result = predictPerformance({ performances: [sprint200, middle800], targetEventId: "5000" });
    expect(result.status).toBe("unsupported");
    expect(result.explanation).toBe(unsupportedMessage);
    expect(result).not.toHaveProperty("predictedTimeMilliseconds");
  });

  it("falls back to the nearest PB outside the anchors when an approved route exists, and says so", () => {
    const result = predictPerformance({
      performances: [
        { eventId: "1500", milliseconds: 270_000 },
        { eventId: "3000", milliseconds: 570_000 },
      ],
      targetEventId: "5000",
    });
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.methodId).toBe("power-law");
      expect(result.sourcePerformances).toEqual([{ eventId: "3000", milliseconds: 570_000 }]);
      expect(result.warnings.map((warning) => warning.code)).toContain("outside-anchors");
      expect(result.warnings.find((warning) => warning.code === "outside-anchors")?.message).toContain("3000m PB only");
    }
  });
});
