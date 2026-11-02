import { formatPerformanceTime } from "../formatting";
import type { ValidationResult } from "../types";
import { invalidResult, validResult, validationError } from "../validation";
import standards from "./wmaRoadStandards2025.json";

export type AgeGradeSex = "M" | "W";

export type AgeGradeDistanceId = "5k" | "10k" | "half" | "marathon";

export type AgeGradeResult = {
  sex: AgeGradeSex;
  age: number;
  distanceId: AgeGradeDistanceId;
  distanceLabel: string;
  actualMilliseconds: number;
  ageGradePercent: number;
  openEquivalentMilliseconds: number;
  bandLabel: string;
  edition: string;
};

type AgeRow = { standardSeconds: number; factor: number };

type StandardsFile = {
  edition: string;
  genders: Record<
    AgeGradeSex,
    Record<AgeGradeDistanceId, { label: string; openStandardSeconds: number; byAge: Record<string, AgeRow> }>
  >;
};

const tables = standards as StandardsFile;

export const ageGradeEdition = tables.edition;

export const ageGradeDistances: readonly { id: AgeGradeDistanceId; label: string; metres: number }[] = [
  { id: "5k", label: "5K", metres: 5000 },
  { id: "10k", label: "10K", metres: 10_000 },
  { id: "half", label: "Half Marathon", metres: 21_097.5 },
  { id: "marathon", label: "Marathon", metres: 42_195 },
];

export function ageGradeBand(percent: number): string {
  if (percent >= 90) {
    return "World class";
  }
  if (percent >= 80) {
    return "National class";
  }
  if (percent >= 70) {
    return "Regional class";
  }
  if (percent >= 60) {
    return "Club level";
  }
  if (percent >= 50) {
    return "Good club runner";
  }
  return "Recreational";
}

export function calculateAgeGrade(input: {
  sex: AgeGradeSex;
  age: number;
  distanceId: AgeGradeDistanceId;
  milliseconds: number;
}): ValidationResult<AgeGradeResult> {
  const errors = [];

  if (input.sex !== "M" && input.sex !== "W") {
    errors.push(validationError("sex", "invalid", "Choose men or women."));
  }

  if (!Number.isInteger(input.age) || input.age < 5 || input.age > 100) {
    errors.push(validationError("age", "out-of-range", "Enter an age between 5 and 100."));
  }

  const event = tables.genders[input.sex]?.[input.distanceId];
  if (!event) {
    errors.push(validationError("distance", "unsupported-event", "Choose a supported road distance."));
  }

  if (!Number.isFinite(input.milliseconds) || input.milliseconds <= 0) {
    errors.push(validationError("time", "zero-duration", "Enter a time greater than zero."));
  }

  if (errors.length > 0 || !event) {
    return invalidResult(errors);
  }

  const row = event.byAge[String(input.age)];
  if (!row) {
    return invalidResult([validationError("age", "unsupported", "No age-grade standard for that age.")]);
  }

  const actualSeconds = input.milliseconds / 1000;
  const ageGradePercent = (row.standardSeconds / actualSeconds) * 100;
  const openEquivalentMilliseconds = input.milliseconds * row.factor;

  return validResult({
    sex: input.sex,
    age: input.age,
    distanceId: input.distanceId,
    distanceLabel: event.label,
    actualMilliseconds: input.milliseconds,
    ageGradePercent,
    openEquivalentMilliseconds,
    bandLabel: ageGradeBand(ageGradePercent),
    edition: tables.edition,
  });
}

export const ageGradeGuideNote =
  "Age-grading uses USATF MLDR / WMA 2025 road standards (Alan Lytton Jones, CC0). Higher % means a stronger age-adjusted performance.";

export function presentAgeGrade(result: AgeGradeResult) {
  const sexLabel = result.sex === "M" ? "men" : "women";
  return {
    percent: `${result.ageGradePercent.toFixed(2)}%`,
    band: result.bandLabel,
    openEquivalent: formatPerformanceTime(result.openEquivalentMilliseconds),
    note: `${ageGradeGuideNote} Tables: ${result.edition} (${sexLabel}, age ${result.age}).`,
  };
}
