import type { PerformanceInput, PredictionUnsupported } from "./types";

export const unsupportedMessage =
  "We need a more relevant PB to estimate this distance reliably. Add a second PB closer to the target distance, or choose a nearer event.";

export function unsupportedPrediction(
  sourcePerformances: readonly PerformanceInput[],
  targetEventId: string,
): PredictionUnsupported {
  return {
    status: "unsupported",
    sourcePerformances,
    targetEventId,
    warnings: [],
    explanation: unsupportedMessage,
    isEstimatedEquivalent: true,
  };
}
