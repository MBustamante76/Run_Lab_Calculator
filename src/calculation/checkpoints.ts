import { formatPerformanceTime, formatSplit } from "./formatting";
import type { ValidationResult } from "./types";
import { invalidResult, validResult, validationError } from "./validation";

export type RaceCheckpoint = {
  metres: number;
  cumulativeMilliseconds: number;
  splitMilliseconds: number;
};

export type CheckpointPlan = {
  totalTimeMilliseconds: number;
  distanceMetres: number;
  checkpoints: readonly RaceCheckpoint[];
};

/**
 * Even-pace checkpoint distances for a race. Short races step by 100 m,
 * middle by 400 m, longer races by 1000 m. The finish distance is always included.
 */
export function checkpointMetresFor(distanceMetres: number): readonly number[] {
  if (!Number.isFinite(distanceMetres) || distanceMetres <= 0) {
    return [];
  }

  const step = distanceMetres <= 800 ? 100 : distanceMetres <= 2000 ? 400 : 1000;
  const points: number[] = [];
  for (let metres = step; metres < distanceMetres - 0.5; metres += step) {
    points.push(metres);
  }
  points.push(distanceMetres);
  return points;
}

export function buildEvenCheckpointPlan(
  distanceMetres: number,
  totalTimeMilliseconds: number,
): ValidationResult<CheckpointPlan> {
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

  const metresList = checkpointMetresFor(distanceMetres);
  let previousMetres = 0;
  const checkpoints = metresList.map((metres) => {
    const cumulativeMilliseconds = (totalTimeMilliseconds * metres) / distanceMetres;
    const splitMilliseconds =
      (totalTimeMilliseconds * (metres - previousMetres)) / distanceMetres;
    previousMetres = metres;
    return { metres, cumulativeMilliseconds, splitMilliseconds };
  });

  return validResult({
    totalTimeMilliseconds,
    distanceMetres,
    checkpoints,
  });
}

export const evenCheckpointNote =
  "These are even-pace checkpoint times. Real races often vary slightly from lap to lap.";

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
    note: evenCheckpointNote,
  };
}

function formatCheckpointMetres(metres: number): string {
  if (Number.isInteger(metres)) {
    return `${metres} m`;
  }
  return `${metres.toFixed(3).replace(/\.?0+$/, "")} m`;
}
