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
  // Riegel fallback (k=1.06). Sprint↔sprint (e.g. 100→200, 200→400) allowed; sprint→long stays blocked in the strategy.
  powerLaw: {
    methodId: "power-law",
    version: "1.06-1.0.0",
    label: "Distance scaling",
    status: "approved",
    enabled: true,
    exponent: 1.06,
    sourceEventIds: ["100", "200", "400", "600", "800", "1000", "1500", "mile", "2000", "3000", "5000", "10k"],
    targetEventIds: ["100", "200", "400", "600", "800", "1000", "1500", "mile", "2000", "3000", "5000", "10k"],
    maximumDistanceRatio: 4,
    warning:
      "General estimate from one PB. This is an indicative estimate, not a guarantee — especially for short sprints.",
  },
};
