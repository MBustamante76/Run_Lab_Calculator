import { formatPerformanceTime, formatSplit } from "./formatting";
import { METRES_PER_KILOMETRE, METRES_PER_MILE } from "./units";
import type { ValidationResult } from "./types";
import { invalidResult, validResult, validationError } from "./validation";

export type RaceCheckpoint = {
  metres: number;
  cumulativeMilliseconds: number;
  splitMilliseconds: number;
};

export type PacingStrategy = "even" | "negative";

export type SplitSpacing = "auto" | "100" | "400" | "1000" | "mile";

export type CheckpointPlan = {
  totalTimeMilliseconds: number;
  distanceMetres: number;
  pacingStrategy: PacingStrategy;
  splitSpacing: SplitSpacing;
  checkpoints: readonly RaceCheckpoint[];
};

export const NEGATIVE_SPLIT_SECOND_HALF_FASTER = 0.02;

/**
 * Even-pace checkpoint distances for a race. Short races step by 100 m,
 * middle by 400 m, longer races by 1000 m. The finish distance is always included.
 */
export function autoCheckpointStepMetres(distanceMetres: number): number {
  if (distanceMetres <= 800) {
    return 100;
  }
  if (distanceMetres <= 2000) {
    return 400;
  }
  return 1000;
}

export function spacingStepMetres(spacing: SplitSpacing, distanceMetres: number): number {
  switch (spacing) {
    case "100":
      return 100;
    case "400":
      return 400;
    case "1000":
      return METRES_PER_KILOMETRE;
    case "mile":
      return METRES_PER_MILE;
    case "auto":
    default:
      return autoCheckpointStepMetres(distanceMetres);
  }
}

export function checkpointMetresFor(
  distanceMetres: number,
  spacing: SplitSpacing = "auto",
): readonly number[] {
  if (!Number.isFinite(distanceMetres) || distanceMetres <= 0) {
    return [];
  }

  const step = spacingStepMetres(spacing, distanceMetres);
  if (step >= distanceMetres) {
    return [distanceMetres];
  }

  const points: number[] = [];
  for (let metres = step; metres < distanceMetres - 0.5; metres += step) {
    points.push(metres);
  }
  points.push(distanceMetres);
  return points;
}

/** Cumulative time at `metres` for even or 2% negative-split half pacing. */
export function cumulativeTimeAtMetres(
  metres: number,
  distanceMetres: number,
  totalTimeMilliseconds: number,
  pacingStrategy: PacingStrategy,
): number {
  if (pacingStrategy === "even") {
    return (totalTimeMilliseconds * metres) / distanceMetres;
  }

  const half = distanceMetres / 2;
  const firstHalfTime = totalTimeMilliseconds / (1 + (1 - NEGATIVE_SPLIT_SECOND_HALF_FASTER));
  const secondHalfTime = totalTimeMilliseconds - firstHalfTime;

  if (metres <= half) {
    return (firstHalfTime * metres) / half;
  }

  return firstHalfTime + (secondHalfTime * (metres - half)) / half;
}

export function buildCheckpointPlan(
  distanceMetres: number,
  totalTimeMilliseconds: number,
  options: { pacingStrategy?: PacingStrategy; splitSpacing?: SplitSpacing } = {},
): ValidationResult<CheckpointPlan> {
  const pacingStrategy = options.pacingStrategy ?? "even";
  const splitSpacing = options.splitSpacing ?? "auto";
  const errors = [];

  if (typeof distanceMetres !== "number" || !Number.isFinite(distanceMetres) || distanceMetres <= 0) {
    errors.push(validationError("distance", "out-of-range", "Enter a distance greater than zero."));
  }

  if (
    typeof totalTimeMilliseconds !== "number" ||
    !Number.isFinite(totalTimeMilliseconds) ||
    totalTimeMilliseconds <= 0
  ) {
    errors.push(validationError("time", "zero-duration", "Enter a time greater than zero."));
  }

  if (errors.length > 0) {
    return invalidResult(errors);
  }

  const metresList = checkpointMetresFor(distanceMetres, splitSpacing);
  let previousMetres = 0;
  const checkpoints = metresList.map((metres) => {
    const cumulativeMilliseconds = cumulativeTimeAtMetres(
      metres,
      distanceMetres,
      totalTimeMilliseconds,
      pacingStrategy,
    );
    const previousCumulative = cumulativeTimeAtMetres(
      previousMetres,
      distanceMetres,
      totalTimeMilliseconds,
      pacingStrategy,
    );
    const splitMilliseconds = cumulativeMilliseconds - previousCumulative;
    previousMetres = metres;
    return { metres, cumulativeMilliseconds, splitMilliseconds };
  });

  return validResult({
    totalTimeMilliseconds,
    distanceMetres,
    pacingStrategy,
    splitSpacing,
    checkpoints,
  });
}

/** @deprecated Prefer buildCheckpointPlan */
export function buildEvenCheckpointPlan(
  distanceMetres: number,
  totalTimeMilliseconds: number,
): ValidationResult<CheckpointPlan> {
  return buildCheckpointPlan(distanceMetres, totalTimeMilliseconds, {
    pacingStrategy: "even",
    splitSpacing: "auto",
  });
}

export const evenCheckpointNote =
  "These are even-pace checkpoint times. Real races often vary slightly from lap to lap.";

export const negativeCheckpointNote =
  "These use a 2% negative split: the second half is 2% faster than the first. Real races often vary from the plan.";

export function presentCheckpointPlan(plan: CheckpointPlan) {
  return {
    checkpoints: plan.checkpoints.map((checkpoint) => ({
      metres: checkpoint.metres,
      label:
        Math.abs(checkpoint.metres - plan.distanceMetres) < 0.05
          ? "Finish"
          : `${formatCheckpointMetres(checkpoint.metres)}`,
      cumulative: formatPerformanceTime(checkpoint.cumulativeMilliseconds),
      split: formatSplit(checkpoint.splitMilliseconds),
    })),
    note: plan.pacingStrategy === "negative" ? negativeCheckpointNote : evenCheckpointNote,
  };
}

function formatCheckpointMetres(metres: number): string {
  if (Number.isInteger(metres)) {
    return `${metres} m`;
  }
  return `${metres.toFixed(3).replace(/\.?0+$/, "")} m`;
}
