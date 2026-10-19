import { describe, expect, it } from "vitest";
import { eventById, events, type EventDefinition } from "../../src/calculation/events";
import { predictPerformance } from "../../src/calculation/prediction/PredictionEngine";
import { distanceRatio, type StrategyPerformance } from "../../src/calculation/prediction/PredictionStrategy";
import { predictionConfig } from "../../src/calculation/prediction/predictionConfig";
import { TwoPbInterpolationStrategy } from "../../src/calculation/prediction/TwoPbInterpolationStrategy";
import type { EventPairConfig, PredictionConfig } from "../../src/calculation/prediction/types";
import { approvedOnePbRouteMatrix } from "./approvedRouteMatrix";

type StrategyClass = "UNSUPPORTED" | "EVENT_PAIR" | "POWER_LAW" | "TWO_PB_INTERPOLATION";

const powerLawLabels = ["1500m", "1 Mile", "2000m", "3000m", "5000m", "10K"] as const;
const belowPowerLawLabels = ["100m", "200m", "400m", "600m", "800m", "1000m"] as const;

function idFor(label: string): string {
  const event = events.find((candidate) => candidate.label === label);
  if (!event) {
    throw new Error(`Unknown event label: ${label}`);
  }
  return event.id;
}

function selectedStrategy(
  performances: readonly { eventId: string; milliseconds: number }[],
  targetLabel: string,
  config: PredictionConfig = predictionConfig,
): StrategyClass {
  const result = predictPerformance({ performances, targetEventId: idFor(targetLabel) }, config);
  if (result.status === "invalid") {
    throw new Error(`Expected a routing result for ${targetLabel}.`);
  }
  if (result.status === "unsupported") {
    return "UNSUPPORTED";
  }
  if (result.methodId === "event-pair") {
    return "EVENT_PAIR";
  }
  if (result.methodId === "power-law") {
    return "POWER_LAW";
  }
  return "TWO_PB_INTERPOLATION";
}

function onePb(source: string, target: string, config?: PredictionConfig): StrategyClass {
  return selectedStrategy([{ eventId: idFor(source), milliseconds: 60_000 }], target, config);
}

function twoPb(first: string, second: string, target: string, config?: PredictionConfig): StrategyClass {
  return selectedStrategy(
    [
      { eventId: idFor(first), milliseconds: 25_000 },
      { eventId: idFor(second), milliseconds: 130_000 },
    ],
    target,
    config,
  );
}

function oneWayPair(sourceLabel: string, targetLabel: string): EventPairConfig {
  return {
    methodId: "event-pair",
    sourceEventId: idFor(sourceLabel),
    targetEventId: idFor(targetLabel),
    version: "test-fixture",
    label: "Test route",
    status: "approved",
    enabled: true,
    direction: "source-to-target",
    model: { kind: "multiplier", factor: 2 },
    evidence: "Routing fixture only. Not a RUN-LAB coefficient.",
  };
}

function withPairs(pairs: readonly EventPairConfig[]): PredictionConfig {
  return { ...predictionConfig, eventPairs: pairs };
}

describe("approved one-PB route matrix", () => {
  it("lists every ordered source and target exactly once", () => {
    expect(approvedOnePbRouteMatrix).toHaveLength(12 * 11);
    const keys = approvedOnePbRouteMatrix.map((row) => `${row.source}|${row.target}`);
    expect(new Set(keys).size).toBe(132);

    for (const source of events) {
      for (const target of events) {
        if (source.id === target.id) {
          continue;
        }
        expect(keys, `${source.label} -> ${target.label}`).toContain(`${source.label}|${target.label}`);
      }
    }
  });

  it.each(approvedOnePbRouteMatrix)("$source -> $target selects $strategy", (row) => {
    expect(onePb(row.source, row.target)).toBe(row.strategy);
  });
});

describe("power-law split", () => {
  const permitted = [
    ["1500m", "1 Mile"],
    ["1500m", "2000m"],
    ["1500m", "3000m"],
    ["1500m", "5000m"],
    ["1 Mile", "1500m"],
    ["1 Mile", "2000m"],
    ["1 Mile", "3000m"],
    ["1 Mile", "5000m"],
    ["2000m", "1500m"],
    ["2000m", "1 Mile"],
    ["2000m", "3000m"],
    ["2000m", "5000m"],
    ["3000m", "1500m"],
    ["3000m", "1 Mile"],
    ["3000m", "2000m"],
    ["3000m", "5000m"],
    ["3000m", "10K"],
    ["5000m", "1500m"],
    ["5000m", "1 Mile"],
    ["5000m", "2000m"],
    ["5000m", "3000m"],
    ["5000m", "10K"],
    ["10K", "3000m"],
    ["10K", "5000m"],
  ] as const;

  it.each(permitted)("%s -> %s uses power law", (source, target) => {
    expect(onePb(source, target)).toBe("POWER_LAW");
  });

  it.each([
    ["1500m", "10K"],
    ["10K", "1500m"],
    ["1 Mile", "10K"],
    ["10K", "1 Mile"],
    ["2000m", "10K"],
    ["10K", "2000m"],
  ] as const)("%s -> %s stays unsupported when the ratio is above 4", (source, target) => {
    expect(distanceRatio(eventById(idFor(source)).metres, eventById(idFor(target)).metres)).toBeGreaterThan(4);
    expect(onePb(source, target)).toBe("UNSUPPORTED");
  });

  it("classifies every 1500m-and-longer pair from the ratio, in both orders", () => {
    for (const source of powerLawLabels) {
      for (const target of powerLawLabels) {
        if (source === target) {
          continue;
        }
        const ratio = distanceRatio(eventById(idFor(source)).metres, eventById(idFor(target)).metres);
        const expected = ratio <= predictionConfig.powerLaw.maximumDistanceRatio ? "POWER_LAW" : "UNSUPPORTED";
        expect(onePb(source, target), `${source} -> ${target}`).toBe(expected);
        expect(onePb(target, source), `${target} -> ${source}`).toBe(expected);
      }
    }
  });
});

describe("800m and 1000m transition events", () => {
  it.each([
    ["800m", "1500m"],
    ["800m", "3000m"],
    ["800m", "5000m"],
    ["800m", "10K"],
    ["1500m", "800m"],
    ["3000m", "800m"],
    ["5000m", "800m"],
    ["10K", "800m"],
    ["1000m", "1500m"],
    ["1000m", "3000m"],
    ["1000m", "5000m"],
    ["1500m", "1000m"],
    ["3000m", "1000m"],
    ["5000m", "1000m"],
  ] as const)("%s -> %s is unsupported", (source, target) => {
    expect(onePb(source, target)).toBe("UNSUPPORTED");
  });

  it("does not treat 800m or 1000m as a 1500m-and-longer distance", () => {
    expect(eventById("800").metres).toBe(800);
    expect(eventById("1000").metres).toBe(1000);
    expect(predictionConfig.powerLaw.sourceEventIds).not.toContain("800");
    expect(predictionConfig.powerLaw.sourceEventIds).not.toContain("1000");
    expect(predictionConfig.powerLaw.targetEventIds).not.toContain("800");
    expect(predictionConfig.powerLaw.targetEventIds).not.toContain("1000");
  });
});

describe("single PBs below 1500m", () => {
  const cases = belowPowerLawLabels.flatMap((source) =>
    events
      .filter((target) => target.label !== source)
      .map((target) => ({ source, target: target.label })),
  );

  it.each(cases)("$source -> $target is unsupported", ({ source, target }) => {
    expect(onePb(source, target)).toBe("UNSUPPORTED");
  });
});

/**
 * This test injects a temporary event-pair route to verify routing precedence.
 * 800m -> 1500m is NOT enabled in the production V1 configuration.
 * No production event-pair coefficients are currently approved.
 * The 1500m -> 3000m pair below is injected the same way.
 */
describe("event-pair precedence", () => {
  const eightHundredToFifteen = withPairs([oneWayPair("800m", "1500m")]);

  it("uses an enabled one-way pair and does not invent the reverse", () => {
    expect(predictionConfig.eventPairs).toEqual([]);
    expect(onePb("800m", "1500m")).toBe("UNSUPPORTED");
    expect(onePb("800m", "1500m", eightHundredToFifteen)).toBe("EVENT_PAIR");
    expect(onePb("1500m", "800m", eightHundredToFifteen)).toBe("UNSUPPORTED");
  });

  it("prefers an exact event pair to the power-law fallback", () => {
    const config = withPairs([oneWayPair("1500m", "3000m")]);
    expect(onePb("1500m", "3000m", config)).toBe("EVENT_PAIR");
    expect(onePb("3000m", "1500m", config)).toBe("POWER_LAW");
  });
});

describe("two-PB routing split", () => {
  it.each([
    ["200m", "800m", "400m"],
    ["200m", "800m", "600m"],
    ["400m", "1500m", "600m"],
    ["400m", "1500m", "800m"],
    ["400m", "1500m", "1000m"],
    ["800m", "3000m", "1000m"],
    ["800m", "3000m", "1500m"],
    ["800m", "3000m", "2000m"],
    ["1500m", "5000m", "1 Mile"],
    ["1500m", "5000m", "2000m"],
    ["1500m", "5000m", "3000m"],
  ] as const)("%s + %s -> %s interpolates", (first, second, target) => {
    expect(twoPb(first, second, target)).toBe("TWO_PB_INTERPOLATION");
    expect(twoPb(second, first, target)).toBe("TWO_PB_INTERPOLATION");
  });

  it.each([
    ["200m", "800m", "100m", "UNSUPPORTED"],
    ["200m", "800m", "1500m", "UNSUPPORTED"],
    ["200m", "800m", "5000m", "UNSUPPORTED"],
    ["1500m", "5000m", "800m", "UNSUPPORTED"],
    ["1500m", "5000m", "10K", "POWER_LAW"],
  ] as const)("%s + %s -> %s does not use the personal curve", (first, second, target, expected) => {
    expect(twoPb(first, second, target)).toBe(expected);
    expect(twoPb(first, second, target)).not.toBe("TWO_PB_INTERPOLATION");
  });
});

describe("interpolation span boundary", () => {
  function synthetic(metres: number): StrategyPerformance {
    const event: EventDefinition = {
      id: `synthetic-${metres}`,
      label: `${metres}m`,
      metres,
      group: "middle",
      supportedToolIds: ["predict"],
      splitMetres: [],
      prediction: { route: "middle" },
    };
    return { eventId: event.id, milliseconds: 60_000, event };
  }

  function permitted(shorterMetres: number, longerMetres: number): boolean {
    const shorter = synthetic(shorterMetres);
    const longer = synthetic(longerMetres);
    const target = synthetic((shorterMetres + longerMetres) / 2);
    const result = new TwoPbInterpolationStrategy(predictionConfig.interpolation).predict(
      { performances: [shorter, { ...longer, milliseconds: 120_000 }], target: target.event },
      {},
    );
    return result?.methodId === "two-pb-interpolation";
  }

  it("permits a ratio of 4 and rejects a ratio just above it", () => {
    expect(distanceRatio(1_000_000, 3_999_999)).toBeCloseTo(3.999999, 6);
    expect(distanceRatio(1_000_000, 4_000_000)).toBe(4);
    expect(distanceRatio(1_000_000, 4_000_001)).toBeCloseTo(4.000001, 6);
    expect(permitted(1_000_000, 3_999_999)).toBe(true);
    expect(permitted(1_000_000, 4_000_000)).toBe(true);
    expect(permitted(1_000_000, 4_000_001)).toBe(false);
  });

  it.each([
    ["200m", "800m", "400m", 4, "TWO_PB_INTERPOLATION"],
    ["400m", "1500m", "800m", 3.75, "TWO_PB_INTERPOLATION"],
    ["800m", "3000m", "1500m", 3.75, "TWO_PB_INTERPOLATION"],
    ["200m", "1000m", "400m", 5, "UNSUPPORTED"],
    ["400m", "2000m", "800m", 5, "UNSUPPORTED"],
    ["800m", "5000m", "1000m", 6.25, "UNSUPPORTED"],
    ["1500m", "10K", "3000m", 10_000 / 1500, "POWER_LAW"],
  ] as const)("%s + %s -> %s respects the %s span", (first, second, target, ratio, expected) => {
    expect(distanceRatio(eventById(idFor(first)).metres, eventById(idFor(second)).metres)).toBeCloseTo(ratio, 5);
    expect(twoPb(first, second, target)).toBe(expected);
    if (expected !== "TWO_PB_INTERPOLATION") {
      expect(twoPb(first, second, target)).not.toBe("TWO_PB_INTERPOLATION");
    }
  });
});

describe("strategy precedence", () => {
  it("rejects invalid input before choosing a strategy", () => {
    const result = predictPerformance({
      performances: [
        { eventId: "1500", milliseconds: 60_000 },
        { eventId: "1500", milliseconds: 70_000 },
      ],
      targetEventId: "3000",
    });
    expect(result.status).toBe("invalid");
    expect(result).not.toHaveProperty("methodId");
  });

  it("lets bracketing PBs win over power law and over an event pair", () => {
    const config = withPairs([oneWayPair("1500m", "3000m")]);
    expect(onePb("1500m", "3000m")).toBe("POWER_LAW");
    expect(onePb("1500m", "3000m", config)).toBe("EVENT_PAIR");
    expect(twoPb("1500m", "5000m", "3000m", config)).toBe("TWO_PB_INTERPOLATION");
  });
});

describe("routing thresholds come from configuration", () => {
  it("pins the approved limits and the power-law event lists", () => {
    expect(predictionConfig.interpolation.maximumAnchorRatio).toBe(4);
    expect(predictionConfig.powerLaw.maximumDistanceRatio).toBe(4);
    expect(predictionConfig.powerLaw.sourceEventIds).toEqual(["1500", "mile", "2000", "3000", "5000", "10k"]);
    expect(predictionConfig.powerLaw.targetEventIds).toEqual(["1500", "mile", "2000", "3000", "5000", "10k"]);
    expect(predictionConfig.eventPairs).toEqual([]);
  });

  it("follows a different power-law ratio and event list without a hardcoded 1500m cutoff", () => {
    const widerRatio: PredictionConfig = {
      ...predictionConfig,
      powerLaw: { ...predictionConfig.powerLaw, maximumDistanceRatio: 7 },
    };
    expect(onePb("1500m", "10K", widerRatio)).toBe("POWER_LAW");
    expect(onePb("1500m", "10K")).toBe("UNSUPPORTED");

    const includeEightHundred: PredictionConfig = {
      ...predictionConfig,
      powerLaw: {
        ...predictionConfig.powerLaw,
        sourceEventIds: [...predictionConfig.powerLaw.sourceEventIds, "800"],
        targetEventIds: [...predictionConfig.powerLaw.targetEventIds, "800"],
      },
    };
    expect(onePb("800m", "1500m", includeEightHundred)).toBe("POWER_LAW");
    expect(onePb("800m", "1500m")).toBe("UNSUPPORTED");
  });

  it("follows a tighter interpolation span", () => {
    const tighter: PredictionConfig = {
      ...predictionConfig,
      interpolation: { ...predictionConfig.interpolation, maximumAnchorRatio: 3.9 },
    };
    expect(twoPb("200m", "800m", "400m", tighter)).toBe("UNSUPPORTED");
    expect(twoPb("200m", "800m", "400m")).toBe("TWO_PB_INTERPOLATION");
  });
});
