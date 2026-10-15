import { formatPerformanceTime } from "../formatting";
import {
  distanceRatio,
  isUsable,
  type PredictionStrategy,
  type StrategyInput,
  type StrategyPerformance,
  type StrategyPrediction,
} from "./PredictionStrategy";
import type { PredictionOptions, TwoPbInterpolationConfig } from "./types";

type Anchor = {
  metres: number;
  milliseconds: number;
};

/**
 * Personal exponent from two PBs:
 *   k = ln(T2 / T1) / ln(D2 / D1)
 *   T = T1 × (D / D1)^k
 * The curve passes through both anchors exactly, so swapping the anchors gives the same time.
 */
export function interpolateTime(first: Anchor, second: Anchor, targetMetres: number): number {
  const exponent =
    Math.log(second.milliseconds / first.milliseconds) / Math.log(second.metres / first.metres);
  return first.milliseconds * (targetMetres / first.metres) ** exponent;
}

function describe(performance: StrategyPerformance): string {
  return `${performance.event.label} PB of ${formatPerformanceTime(performance.milliseconds)}`;
}

export class TwoPbInterpolationStrategy implements PredictionStrategy {
  readonly methodId = "two-pb-interpolation" as const;

  constructor(private readonly config: TwoPbInterpolationConfig) {}

  predict(input: StrategyInput, options: PredictionOptions): StrategyPrediction | null {
    if (!isUsable(this.config, options) || input.performances.length !== 2) {
      return null;
    }

    const [firstInput, secondInput] = input.performances;
    if (!firstInput || !secondInput) {
      return null;
    }

    const [shorter, longer] =
      firstInput.event.metres < secondInput.event.metres
        ? [firstInput, secondInput]
        : [secondInput, firstInput];

    const targetMetres = input.target.metres;
    const between = targetMetres > shorter.event.metres && targetMetres < longer.event.metres;
    const ratio = distanceRatio(shorter.event.metres, longer.event.metres);

    if (!between || ratio > this.config.maximumAnchorRatio) {
      return null;
    }

    return {
      predictedTimeMilliseconds: interpolateTime(
        { metres: shorter.event.metres, milliseconds: shorter.milliseconds },
        { metres: longer.event.metres, milliseconds: longer.milliseconds },
        targetMetres,
      ),
      methodId: this.methodId,
      methodVersion: this.config.version,
      methodLabel: this.config.label,
      status: this.config.status,
      sourcePerformances: [
        { eventId: shorter.eventId, milliseconds: shorter.milliseconds },
        { eventId: longer.eventId, milliseconds: longer.milliseconds },
      ],
      explanation: `Estimated between your ${describe(shorter)} and your ${describe(longer)}. The ${input.target.label} lies between those two distances.`,
    };
  }
}
