import type { EventDefinition } from "../events";
import type { ConfigStatus, MethodId, PerformanceInput, PredictionOptions } from "./types";

export type StrategyPerformance = PerformanceInput & {
  event: EventDefinition;
};

export type StrategyInput = {
  performances: readonly StrategyPerformance[];
  target: EventDefinition;
};

export type StrategyPrediction = {
  predictedTimeMilliseconds: number;
  methodId: MethodId;
  methodVersion: string;
  methodLabel: string;
  status: ConfigStatus;
  sourcePerformances: readonly PerformanceInput[];
  explanation: string;
  warning?: string;
};

export interface PredictionStrategy {
  readonly methodId: MethodId;
  predict(input: StrategyInput, options: PredictionOptions): StrategyPrediction | null;
}

export function isUsable(
  config: { status: ConfigStatus; enabled: boolean },
  options: PredictionOptions,
): boolean {
  return config.enabled && (config.status === "approved" || options.includeDraft === true);
}

export function distanceRatio(firstMetres: number, secondMetres: number): number {
  return Math.max(firstMetres, secondMetres) / Math.min(firstMetres, secondMetres);
}
