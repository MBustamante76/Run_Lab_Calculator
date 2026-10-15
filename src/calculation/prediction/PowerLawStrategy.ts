import { formatPerformanceTime } from "../formatting";
import {
  distanceRatio,
  isUsable,
  type PredictionStrategy,
  type StrategyInput,
  type StrategyPrediction,
} from "./PredictionStrategy";
import type { PowerLawConfig, PredictionOptions } from "./types";

/**
 * Riegel-style power law: T2 = T1 × (D2 / D1)^exponent.
 * A sprint PB never routes to a long-distance target here, whatever the configuration says.
 */
export class PowerLawStrategy implements PredictionStrategy {
  readonly methodId = "power-law" as const;

  constructor(private readonly config: PowerLawConfig) {}

  predict(input: StrategyInput, options: PredictionOptions): StrategyPrediction | null {
    if (!isUsable(this.config, options)) {
      return null;
    }

    for (const source of input.performances) {
      if (source.event.group === "sprint" && input.target.group === "long") {
        continue;
      }
      if (!this.config.sourceEventIds.includes(source.eventId)) {
        continue;
      }
      if (!this.config.targetEventIds.includes(input.target.id)) {
        continue;
      }
      if (distanceRatio(source.event.metres, input.target.metres) > this.config.maximumDistanceRatio) {
        continue;
      }

      return {
        predictedTimeMilliseconds:
          source.milliseconds * (input.target.metres / source.event.metres) ** this.config.exponent,
        methodId: this.methodId,
        methodVersion: this.config.version,
        methodLabel: this.config.label,
        status: this.config.status,
        sourcePerformances: [{ eventId: source.eventId, milliseconds: source.milliseconds }],
        explanation: `Estimated from your ${source.event.label} PB of ${formatPerformanceTime(source.milliseconds)}, scaled to ${input.target.label}.`,
        warning: this.config.warning,
      };
    }
    return null;
  }
}
