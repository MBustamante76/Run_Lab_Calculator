import { formatFinishTime, formatPace, formatSpeed, formatSplit } from "./formatting";
import { calculateRaceMetrics } from "./raceMetrics";
import type { RaceMetrics, ValidationResult } from "./types";
import { METRES_PER_KILOMETRE, METRES_PER_MILE } from "./units";
import { invalidResult, validResult, validationError } from "./validation";

export type PaceUnit = "kilometre" | "mile";

export const maintainedPaceNote =
  "This assumes the entered average pace is maintained for the full distance.";

function unitMetres(unit: PaceUnit): number {
  return unit === "kilometre" ? METRES_PER_KILOMETRE : METRES_PER_MILE;
}

/**
 * Finishing time is the entered pace multiplied by the distance in that pace unit.
 * Call calculateRaceMetrics with the derived time for pace, speed and rhythms.
 */
export function deriveFinishingTime(
  distanceMetres: number,
  paceMilliseconds: number,
  unit: PaceUnit,
): ValidationResult<number> {
  const errors = [];

  if (typeof distanceMetres !== "number" || !Number.isFinite(distanceMetres) || distanceMetres <= 0) {
    errors.push(validationError("distance", "out-of-range", "Enter a distance greater than zero."));
  }

  if (typeof paceMilliseconds !== "number" || !Number.isFinite(paceMilliseconds) || paceMilliseconds <= 0) {
    errors.push(validationError("pace", "zero-duration", "Enter a pace greater than zero."));
  }

  if (errors.length > 0) {
    return invalidResult(errors);
  }

  return validResult(paceMilliseconds * (distanceMetres / unitMetres(unit)));
}

export function finishingTimeMetrics(
  distanceMetres: number,
  paceMilliseconds: number,
  unit: PaceUnit,
): ValidationResult<RaceMetrics> {
  const derived = deriveFinishingTime(distanceMetres, paceMilliseconds, unit);
  if (!derived.ok) {
    return derived;
  }
  return calculateRaceMetrics(distanceMetres, derived.value);
}

export function presentFinishingTime(metrics: RaceMetrics, unit: PaceUnit) {
  const enteredIsKilometre = unit === "kilometre";

  return {
    finishingTime: formatFinishTime(metrics.totalTimeMilliseconds),
    enteredPaceLabel: enteredIsKilometre ? "Pace per km" : "Pace per mile",
    enteredPace: formatPace(
      enteredIsKilometre ? metrics.pacePerKilometreMilliseconds : metrics.pacePerMileMilliseconds,
    ),
    convertedPaceLabel: enteredIsKilometre ? "Pace per mile" : "Pace per km",
    convertedPace: formatPace(
      enteredIsKilometre ? metrics.pacePerMileMilliseconds : metrics.pacePerKilometreMilliseconds,
    ),
    speedKilometresPerHour: formatSpeed(metrics.speedKilometresPerHour),
    speedMilesPerHour: formatSpeed(metrics.speedMilesPerHour),
    rhythms: metrics.rhythms.map((rhythm) => ({
      metres: rhythm.metres,
      time: formatSplit(rhythm.milliseconds),
    })),
    note: maintainedPaceNote,
  };
}
