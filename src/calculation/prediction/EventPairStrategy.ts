import { formatPerformanceTime } from "../formatting";
import {
  isUsable,
  type PredictionStrategy,
  type StrategyInput,
  type StrategyPrediction,
} from "./PredictionStrategy";
import type { EventPairConfig, EventPairModel, PredictionOptions } from "./types";

type Match = {
  config: EventPairConfig;
  reversed: boolean;
};

function findPair(
  pairs: readonly EventPairConfig[],
  sourceEventId: string,
  targetEventId: string,
  options: PredictionOptions,
): Match | null {
  for (const config of pairs) {
    if (!isUsable(config, options)) {
      continue;
    }
    if (config.sourceEventId === sourceEventId && config.targetEventId === targetEventId) {
      return { config, reversed: false };
    }
    if (
      config.direction === "both" &&
      config.sourceEventId === targetEventId &&
      config.targetEventId === sourceEventId
    ) {
      return { config, reversed: true };
    }
  }
  return null;
}

/**
 * Multiplier: target = factor × source.
 * Exponent:   target = source × (target metres / source metres)^exponent.
 * A reversed "both" pair inverts the same relationship.
 */
function applyModel(
  model: EventPairModel,
  sourceMilliseconds: number,
  sourceMetres: number,
  targetMetres: number,
  reversed: boolean,
): number {
  if (model.kind === "multiplier") {
    return reversed ? sourceMilliseconds / model.factor : sourceMilliseconds * model.factor;
  }
  return sourceMilliseconds * (targetMetres / sourceMetres) ** model.exponent;
}

export class EventPairStrategy implements PredictionStrategy {
  readonly methodId = "event-pair" as const;

  constructor(private readonly pairs: readonly EventPairConfig[]) {}

  predict(input: StrategyInput, options: PredictionOptions): StrategyPrediction | null {
    for (const source of input.performances) {
      const match = findPair(this.pairs, source.eventId, input.target.id, options);
      if (!match) {
        continue;
      }

      return {
        predictedTimeMilliseconds: applyModel(
          match.config.model,
          source.milliseconds,
          source.event.metres,
          input.target.metres,
          match.reversed,
        ),
        methodId: this.methodId,
        methodVersion: match.config.version,
        methodLabel: match.config.label,
        status: match.config.status,
        sourcePerformances: [{ eventId: source.eventId, milliseconds: source.milliseconds }],
        explanation: `Estimated from your ${source.event.label} PB of ${formatPerformanceTime(source.milliseconds)} using a ${source.event.label} to ${input.target.label} relationship.`,
      };
    }
    return null;
  }
}
