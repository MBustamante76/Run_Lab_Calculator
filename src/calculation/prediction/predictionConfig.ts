import type { PredictionConfig } from "./types";

/**
 * Tool 01 configuration approved by RUN-LAB on 15 October 2026.
 * See docs/tool-01-methodology-review.md.
 */
export const predictionConfig: PredictionConfig = {
  interpolation: {
    methodId: "two-pb-interpolation",
    version: "1.0.0",
    label: "Based on your two PBs",
    status: "approved",
    enabled: true,
    maximumAnchorRatio: 4,
  },
  // Only approved empirical KsA relationships may be added here. No sex-neutral short-distance coefficients in V1.
  eventPairs: [],
  // Prototype Riegel fallback (k=1.06). Includes middle distances; sprint→long stays blocked in the strategy.
  powerLaw: {
    methodId: "power-law",
    version: "1.06-1.0.0",
    label: "Middle and long-distance scaling",
    status: "approved",
    enabled: true,
    exponent: 1.06,
    sourceEventIds: ["400", "600", "800", "1000", "1500", "mile", "2000", "3000", "5000", "10k"],
    targetEventIds: ["400", "600", "800", "1000", "1500", "mile", "2000", "3000", "5000", "10k"],
    maximumDistanceRatio: 4,
    warning:
      "General estimate from one PB. This estimate assumes a similar level of endurance across both distances.",
  },
};
