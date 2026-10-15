import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eventById, events } from "../../src/calculation/events";
import {
  draftMethodWarning,
  estimatedEquivalentLabel,
  predictPerformance,
} from "../../src/calculation/prediction/PredictionEngine";
import { predictionConfig } from "../../src/calculation/prediction/predictionConfig";
import type { PredictionConfig } from "../../src/calculation/prediction/types";
import { unsupportedMessage } from "../../src/calculation/prediction/UnsupportedPredictionStrategy";
import {
  approvedConfig,
  draftReview,
  middle800,
  pb1500,
  pb5000,
  sprint100,
  sprint200,
} from "./fixtures";

describe("approved production configuration", () => {
  it("approves interpolation and the power-law fallback, with no event-pair coefficients", () => {
    expect(predictionConfig.interpolation.status).toBe("approved");
    expect(predictionConfig.interpolation.maximumAnchorRatio).toBe(4);
    expect(predictionConfig.powerLaw.status).toBe("approved");
    expect(predictionConfig.powerLaw.exponent).toBe(1.06);
    expect(predictionConfig.powerLaw.maximumDistanceRatio).toBe(4);
    expect(predictionConfig.eventPairs).toEqual([]);
  });

  it("limits the power law to 1500m and longer, excluding 800m", () => {
    for (const eventId of [...predictionConfig.powerLaw.sourceEventIds, ...predictionConfig.powerLaw.targetEventIds]) {
      expect(eventById(eventId)?.metres, eventId).toBeGreaterThanOrEqual(1500);
    }
    expect(predictionConfig.powerLaw.sourceEventIds).not.toContain("800");
    expect(predictionConfig.powerLaw.targetEventIds).not.toContain("800");
  });

  it("keeps 800m available as a PB and a target", () => {
    expect(eventById("800")?.supportedToolIds).toContain("predict");
    const pb400 = { eventId: "400", milliseconds: 57_000 };
    expect(predictPerformance({ performances: [pb400, pb1500], targetEventId: "800" }).status).toBe("success");
    expect(predictPerformance({ performances: [sprint200, middle800], targetEventId: "400" }).status).toBe("success");
  });

  it("returns no time for an 800m PB alone", () => {
    for (const targetEventId of ["400", "1500", "3000"]) {
      const result = predictPerformance({ performances: [middle800], targetEventId });
      expect(result.status, targetEventId).toBe("unsupported");
      expect(result).not.toHaveProperty("predictedTimeMilliseconds");
    }
  });

  it("shows a friendly method label and keeps the exact version internal", () => {
    const result = predictPerformance({ performances: [pb1500], targetEventId: "3000" });
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.methodLabel).toBe("Middle and long-distance scaling");
      expect(result.methodVersion).toBe("1.06-1.0.0");
      expect(result.methodLabel).not.toMatch(/1\.06|power|exponent|version/i);
      expect(result.explanation).not.toMatch(/1\.06|exponent|version/i);
    }
  });
});

describe("prediction router", () => {
  it("routes a single approved event-pair relationship before the power law", () => {
    const result = predictPerformance(
      { performances: [{ eventId: "400", milliseconds: 60_000 }], targetEventId: "800" },
      approvedConfig,
    );
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.methodId).toBe("event-pair");
      expect(result.predictedTimeMilliseconds).toBe(150_000);
      expect(result.methodVersion).toBe("test-fixture");
    }

    const reversed = predictPerformance(
      { performances: [{ eventId: "800", milliseconds: 150_000 }], targetEventId: "400" },
      approvedConfig,
    );
    expect(reversed.status === "success" && reversed.predictedTimeMilliseconds).toBe(60_000);
  });

  it("routes 1500m to 3000m through the power law with method metadata", () => {
    const result = predictPerformance({ performances: [pb1500], targetEventId: "3000" });
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.methodId).toBe("power-law");
      expect(result.displayTime).toBe("9:22.9");
      expect(result.isEstimatedEquivalent).toBe(true);
      expect(result.explanation).toBe("Estimated from your 1500m PB of 4:30.0, scaled to 3000m.");
      expect(result.warnings.map((warning) => warning.code)).toEqual(["model-assumption"]);
    }
  });

  it("predicts 5000m to 10K", () => {
    const result = predictPerformance({ performances: [pb5000], targetEventId: "10k" });
    expect(result.status === "success" && result.displayTime).toBe("37:31.7");
  });

  it("uses a draft method only during review, and flags it", () => {
    const draft: PredictionConfig = {
      ...predictionConfig,
      powerLaw: { ...predictionConfig.powerLaw, status: "draft" },
    };
    const request = { performances: [pb5000], targetEventId: "10k" };

    expect(predictPerformance(request, draft).status).toBe("unsupported");

    const reviewed = predictPerformance(request, draft, draftReview);
    expect(reviewed.status).toBe("success");
    expect(reviewed.warnings.map((warning) => warning.message)).toContain(draftMethodWarning);
  });

  it("never predicts a long distance from a sprint PB, even with a permissive configuration", () => {
    const permissive: PredictionConfig = {
      ...approvedConfig,
      powerLaw: {
        ...approvedConfig.powerLaw,
        sourceEventIds: events.map((event) => event.id),
        targetEventIds: events.map((event) => event.id),
        maximumDistanceRatio: 1_000,
      },
    };

    for (const source of [sprint100, sprint200]) {
      for (const targetEventId of ["5000", "10k"]) {
        const result = predictPerformance({ performances: [source], targetEventId }, permissive);
        expect(result.status).toBe("unsupported");
        expect(result.explanation).toBe(
          "We need a more relevant PB to estimate this distance reliably. Add a second PB closer to the target distance, or choose a nearer event.",
        );
        expect(result).not.toHaveProperty("predictedTimeMilliseconds");
      }
    }
  });

  it("refuses a power-law prediction beyond the maximum distance ratio", () => {
    const result = predictPerformance({ performances: [pb1500], targetEventId: "10k" });
    expect(result.status).toBe("unsupported");
    expect(result.explanation).toBe(unsupportedMessage);
  });

  it("rejects two PBs at the same distance", () => {
    const result = predictPerformance({
      performances: [pb1500, { eventId: "1500", milliseconds: 280_000 }],
      targetEventId: "3000",
    });
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.errors).toContainEqual(
        expect.objectContaining({ fieldId: "secondEvent", code: "duplicate-event" }),
      );
    }
  });

  it("rejects a target that matches a PB distance", () => {
    const result = predictPerformance({ performances: [pb1500], targetEventId: "1500" });
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.errors).toContainEqual(
        expect.objectContaining({ fieldId: "target", code: "matches-source" }),
      );
    }
  });

  it("rejects an invalid second PB time", () => {
    for (const milliseconds of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = predictPerformance({
        performances: [pb1500, { eventId: "5000", milliseconds }],
        targetEventId: "3000",
      });
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ fieldId: "secondTime", code: "invalid-time" }),
        );
      }
    }
  });

  it("returns the same result for the same request", () => {
    const request = { performances: [pb1500], targetEventId: "3000" };
    expect(predictPerformance(request)).toEqual(predictPerformance(request));
  });

  it("labels every outcome as an estimated equivalent", () => {
    expect(estimatedEquivalentLabel).toBe("Estimated equivalent performance");
    for (const request of [
      { performances: [pb1500], targetEventId: "3000" },
      { performances: [sprint100], targetEventId: "10k" },
      { performances: [pb1500], targetEventId: "1500" },
    ]) {
      expect(predictPerformance(request).isEstimatedEquivalent).toBe(true);
    }
  });

  it("does not use World Athletics scoring", () => {
    const directory = "src/calculation/prediction";
    for (const name of readdirSync(directory)) {
      const source = readFileSync(join(directory, name), "utf8").toLowerCase();
      expect(source).not.toMatch(/world athletics|scoring table|points/);
    }
  });
});
