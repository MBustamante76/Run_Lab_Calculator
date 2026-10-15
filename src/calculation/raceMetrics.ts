import { splitDistancesFor } from "./events";
import { formatPace, formatSpeed, formatSplit } from "./formatting";
import type { RaceMetrics, ValidationResult } from "./types";
import {
  pacePerKilometreMilliseconds,
  pacePerMileMilliseconds,
  speedKilometresPerHour,
  speedMilesPerHour,
} from "./units";
import { invalidResult, validResult, validationError } from "./validation";

/**
 * Shared race-metric engine.
 * Tool 02 calls this directly. Tools 01 and 03 call it after they have derived a finishing time.
 */
export function calculateRaceMetrics(
  distanceMetres: number,
  totalTimeMilliseconds: number,
): ValidationResult<RaceMetrics> {
  const errors = [];

  if (typeof distanceMetres !== "number" || Number.isNaN(distanceMetres)) {
    errors.push(validationError("distance", "not-a-number", "Enter a valid distance."));
  } else if (!Number.isFinite(distanceMetres)) {
    errors.push(validationError("distance", "not-finite", "Enter a finite distance."));
  } else if (distanceMetres <= 0) {
    errors.push(validationError("distance", "out-of-range", "Enter a distance greater than zero."));
  }

  if (typeof totalTimeMilliseconds !== "number" || Number.isNaN(totalTimeMilliseconds)) {
    errors.push(validationError("time", "not-a-number", "Enter a valid time."));
  } else if (!Number.isFinite(totalTimeMilliseconds)) {
    errors.push(validationError("time", "not-finite", "Enter a finite time."));
  } else if (totalTimeMilliseconds <= 0) {
    errors.push(validationError("time", "zero-duration", "Enter a time greater than zero."));
  }

  if (errors.length > 0) {
    return invalidResult(errors);
  }

  return validResult({
    totalTimeMilliseconds,
    pacePerKilometreMilliseconds: pacePerKilometreMilliseconds(distanceMetres, totalTimeMilliseconds),
    pacePerMileMilliseconds: pacePerMileMilliseconds(distanceMetres, totalTimeMilliseconds),
    speedKilometresPerHour: speedKilometresPerHour(distanceMetres, totalTimeMilliseconds),
    speedMilesPerHour: speedMilesPerHour(distanceMetres, totalTimeMilliseconds),
    rhythms: splitDistancesFor(distanceMetres).map((metres) => ({
      metres,
      milliseconds: (totalTimeMilliseconds * metres) / distanceMetres,
    })),
  });
}

export const averageValuesNote = "These are average values over the full distance.";

export function presentRaceMetrics(metrics: RaceMetrics) {
  return {
    pacePerKilometre: formatPace(metrics.pacePerKilometreMilliseconds),
    pacePerMile: formatPace(metrics.pacePerMileMilliseconds),
    speedKilometresPerHour: formatSpeed(metrics.speedKilometresPerHour),
    speedMilesPerHour: formatSpeed(metrics.speedMilesPerHour),
    rhythms: metrics.rhythms.map((rhythm) => ({
      metres: rhythm.metres,
      time: formatSplit(rhythm.milliseconds),
    })),
    note: averageValuesNote,
  };
}
