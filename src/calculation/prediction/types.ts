import type { ValidationError } from "../types";

export type EventId = string;

export type PerformanceInput = {
  eventId: EventId;
  milliseconds: number;
};

export type PredictionRequest = {
  performances: readonly PerformanceInput[];
  targetEventId: EventId;
};

export type MethodId = "two-pb-interpolation" | "event-pair" | "power-law";

export type ConfigStatus = "draft" | "approved";

export type PredictionWarningCode = "draft-method" | "outside-anchors" | "model-assumption";

export type PredictionWarning = {
  code: PredictionWarningCode;
  message: string;
};

type PredictionBase = {
  sourcePerformances: readonly PerformanceInput[];
  targetEventId: EventId;
  warnings: readonly PredictionWarning[];
  explanation: string;
  isEstimatedEquivalent: true;
};

/**
 * Times are integer-millisecond inputs and full-precision millisecond outputs.
 * The brief's `predictedTimeSeconds` is carried as milliseconds to match the rest of the engine.
 */
export type PredictionSuccess = PredictionBase & {
  status: "success";
  predictedTimeMilliseconds: number;
  displayTime: string;
  methodId: MethodId;
  /** Internal and diagnostic use only. Users see `methodLabel`. */
  methodVersion: string;
  methodLabel: string;
};

export type PredictionUnsupported = PredictionBase & {
  status: "unsupported";
};

export type PredictionInvalid = PredictionBase & {
  status: "invalid";
  errors: readonly ValidationError[];
};

export type PredictionResult = PredictionSuccess | PredictionUnsupported | PredictionInvalid;

export type TwoPbInterpolationConfig = {
  methodId: "two-pb-interpolation";
  version: string;
  label: string;
  status: ConfigStatus;
  enabled: boolean;
  /** Longest anchor distance divided by shortest anchor distance. */
  maximumAnchorRatio: number;
};

export type EventPairModel =
  | { kind: "multiplier"; factor: number }
  | { kind: "exponent"; exponent: number };

export type EventPairDirection = "source-to-target" | "both";

export type EventPairConfig = {
  methodId: "event-pair";
  sourceEventId: EventId;
  targetEventId: EventId;
  version: string;
  label: string;
  status: ConfigStatus;
  enabled: boolean;
  direction: EventPairDirection;
  model: EventPairModel;
  evidence: string;
};

export type PowerLawConfig = {
  methodId: "power-law";
  version: string;
  label: string;
  status: ConfigStatus;
  enabled: boolean;
  exponent: number;
  sourceEventIds: readonly EventId[];
  targetEventIds: readonly EventId[];
  /** Longer distance divided by shorter distance. */
  maximumDistanceRatio: number;
  warning: string;
};

export type PredictionConfig = {
  interpolation: TwoPbInterpolationConfig;
  eventPairs: readonly EventPairConfig[];
  powerLaw: PowerLawConfig;
};

export type PredictionOptions = {
  /** Development and methodology review only. Production must not set this. */
  includeDraft?: boolean;
};
