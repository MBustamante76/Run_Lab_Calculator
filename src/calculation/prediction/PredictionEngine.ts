import { events } from "../events";
import { formatPerformanceTime } from "../formatting";
import type { ValidationError } from "../types";
import { validationError } from "../validation";
import { EventPairStrategy } from "./EventPairStrategy";
import { PowerLawStrategy } from "./PowerLawStrategy";
import { predictionConfig as defaultConfig } from "./predictionConfig";
import type { StrategyPerformance, StrategyPrediction } from "./PredictionStrategy";
import { TwoPbInterpolationStrategy } from "./TwoPbInterpolationStrategy";
import { unsupportedPrediction } from "./UnsupportedPredictionStrategy";
import type {
  PredictionConfig,
  PredictionOptions,
  PredictionRequest,
  PredictionResult,
  PredictionWarning,
} from "./types";

export const estimatedEquivalentLabel = "Estimated equivalent performance";

export const draftMethodWarning = "This method is a draft awaiting RUN-LAB approval.";

const performanceFields = ["first", "second"] as const;

function findPredictionEvent(eventId: string) {
  return events.find((event) => event.id === eventId && event.supportedToolIds.includes("predict"));
}

function validate(request: PredictionRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  if (request.performances.length < 1 || request.performances.length > 2) {
    errors.push(validationError("performances", "count", "Enter one or two PBs."));
  }

  if (!findPredictionEvent(request.targetEventId)) {
    errors.push(validationError("target", "unsupported-event", "Choose a supported target distance."));
  }

  request.performances.forEach((performance, index) => {
    const field = performanceFields[index] ?? "performance";
    if (!findPredictionEvent(performance.eventId)) {
      errors.push(validationError(`${field}Event`, "unsupported-event", "Choose a supported PB distance."));
    }
    if (
      typeof performance.milliseconds !== "number" ||
      !Number.isFinite(performance.milliseconds) ||
      performance.milliseconds <= 0
    ) {
      errors.push(validationError(`${field}Time`, "invalid-time", "Enter a PB time greater than zero."));
    }
    if (performance.eventId === request.targetEventId) {
      errors.push(
        validationError("target", "matches-source", "Choose a target distance different from your PB distances."),
      );
    }
  });

  const [first, second] = request.performances;
  if (first && second && first.eventId === second.eventId) {
    errors.push(validationError("secondEvent", "duplicate-event", "Your two PBs must be at different distances."));
  }

  return errors.filter(
    (error, index, all) =>
      all.findIndex((other) => other.fieldId === error.fieldId && other.code === error.code) === index,
  );
}

/** Nearest PB first, measured as a distance ratio so 1500 m is nearer 3000 m than 800 m is. */
function nearestFirst(performances: readonly StrategyPerformance[], targetMetres: number) {
  return [...performances].sort((first, second) => {
    const firstGap = Math.abs(Math.log(first.event.metres / targetMetres));
    const secondGap = Math.abs(Math.log(second.event.metres / targetMetres));
    return firstGap - secondGap;
  });
}

function toSuccess(
  prediction: StrategyPrediction,
  request: PredictionRequest,
  warnings: PredictionWarning[],
): PredictionResult {
  const allWarnings = [...warnings];
  if (prediction.warning) {
    allWarnings.push({ code: "model-assumption", message: prediction.warning });
  }
  if (prediction.status === "draft") {
    allWarnings.push({ code: "draft-method", message: draftMethodWarning });
  }

  return {
    status: "success",
    predictedTimeMilliseconds: prediction.predictedTimeMilliseconds,
    displayTime: formatPerformanceTime(prediction.predictedTimeMilliseconds),
    methodId: prediction.methodId,
    methodVersion: prediction.methodVersion,
    methodLabel: prediction.methodLabel,
    sourcePerformances: prediction.sourcePerformances,
    targetEventId: request.targetEventId,
    warnings: allWarnings,
    explanation: prediction.explanation,
    isEstimatedEquivalent: true,
  };
}

/**
 * Routing order:
 * 1. Two PBs that bracket the target, within the anchor span: personal interpolation.
 * 2. Otherwise, starting from the nearest PB: an approved event-pair relationship.
 * 3. Then the configured power-law model, within its events and distance ratio.
 * 4. Otherwise: unsupported, with no time.
 */
export function predictPerformance(
  request: PredictionRequest,
  config: PredictionConfig = defaultConfig,
  options: PredictionOptions = {},
): PredictionResult {
  const errors = validate(request);
  if (errors.length > 0) {
    return {
      status: "invalid",
      errors,
      sourcePerformances: request.performances,
      targetEventId: request.targetEventId,
      warnings: [],
      explanation: "Check the highlighted fields.",
      isEstimatedEquivalent: true,
    };
  }

  const target = findPredictionEvent(request.targetEventId);
  if (!target) {
    return unsupportedPrediction(request.performances, request.targetEventId);
  }

  const performances: StrategyPerformance[] = request.performances.flatMap((performance) => {
    const event = findPredictionEvent(performance.eventId);
    return event ? [{ ...performance, event }] : [];
  });

  const interpolated = new TwoPbInterpolationStrategy(config.interpolation).predict(
    { performances, target },
    options,
  );
  if (interpolated) {
    return toSuccess(interpolated, request, []);
  }

  const ordered = nearestFirst(performances, target.metres);
  const outsideAnchors = performances.length === 2;

  for (const source of ordered) {
    const single = { performances: [source], target };
    const prediction =
      new EventPairStrategy(config.eventPairs).predict(single, options) ??
      new PowerLawStrategy(config.powerLaw).predict(single, options);

    if (prediction) {
      const warnings: PredictionWarning[] = outsideAnchors
        ? [
            {
              code: "outside-anchors",
              message: `Your target is outside your two PB distances, so your two-PB relationship was not extended. This estimate uses your ${source.event.label} PB only.`,
            },
          ]
        : [];
      return toSuccess(prediction, request, warnings);
    }
  }

  return unsupportedPrediction(request.performances, request.targetEventId);
}
