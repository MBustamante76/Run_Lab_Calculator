import { predictionConfig } from "../../src/calculation/prediction/predictionConfig";
import type {
  EventPairConfig,
  PerformanceInput,
  PredictionConfig,
} from "../../src/calculation/prediction/types";

export const draftReview = { includeDraft: true } as const;

export const sprint200 = { eventId: "200", milliseconds: 25_000 } satisfies PerformanceInput;
export const middle800 = { eventId: "800", milliseconds: 130_000 } satisfies PerformanceInput;
export const pb1500 = { eventId: "1500", milliseconds: 270_000 } satisfies PerformanceInput;
export const pb5000 = { eventId: "5000", milliseconds: 1_080_000 } satisfies PerformanceInput;
export const sprint100 = { eventId: "100", milliseconds: 12_500 } satisfies PerformanceInput;

/**
 * Test-only relationship to exercise the event-pair mechanics.
 * This multiplier is not a RUN-LAB coefficient and must never be copied into predictionConfig.
 */
export const testOnlyPair: EventPairConfig = {
  methodId: "event-pair",
  sourceEventId: "400",
  targetEventId: "800",
  version: "test-fixture",
  label: "Test fixture pair",
  status: "approved",
  enabled: true,
  direction: "both",
  model: { kind: "multiplier", factor: 2.5 },
  evidence: "Test fixture only.",
};

export const approvedConfig: PredictionConfig = {
  interpolation: { ...predictionConfig.interpolation, status: "approved" },
  eventPairs: [testOnlyPair],
  powerLaw: { ...predictionConfig.powerLaw, status: "approved" },
};
