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
  // Fallback for 1500m and longer only; not a universal model.
  powerLaw: {
    methodId: "power-law",
    version: "1.06-1.0.0",
    label: "Middle and long-distance scaling",
    status: "approved",
    enabled: true,
    exponent: 1.06,
    sourceEventIds: ["1500", "mile", "2000", "3000", "5000", "10k"],
    targetEventIds: ["1500", "mile", "2000", "3000", "5000", "10k"],
    maximumDistanceRatio: 4,
    warning: "This estimate assumes a similar level of endurance across both distances.",
  },
};
