import type { ValidationResult } from "../types";
import { invalidResult, validResult, validationError } from "../validation";
import tables from "./waOutdoorTables2025.json";

export type ProfileSex = "M" | "W";

export type ProfilePerformanceInput = {
  eventId: string;
  milliseconds: number;
};

export type ProfilePerformanceScore = {
  eventId: string;
  milliseconds: number;
  points: number;
};

export type PerformanceProfile = {
  sex: ProfileSex;
  edition: string;
  performances: readonly ProfilePerformanceScore[];
  strongestEventId: string;
};

type TableEvent = {
  waCode: string;
  direction: string;
  data: readonly (readonly number[])[];
};

type TablesFile = {
  edition: string;
  genders: Record<ProfileSex, Record<string, TableEvent>>;
};

const scoringTables = tables as TablesFile;

export const worldAthleticsEdition = scoringTables.edition;

export function supportedProfileEventIds(sex: ProfileSex = "M"): readonly string[] {
  return Object.keys(scoringTables.genders[sex]);
}

/**
 * Official WA lookup: for time events, take the highest points whose table mark
 * is greater than or equal to the performance (lower points when between rows).
 */
export function pointsForPerformance(
  sex: ProfileSex,
  eventId: string,
  timeSeconds: number,
): number | null {
  const event = scoringTables.genders[sex][eventId];
  if (!event || !Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    return null;
  }

  let matched: number | null = null;
  for (const row of event.data) {
    const points = row[0];
    const mark = row[1];
    if (typeof points !== "number" || typeof mark !== "number") {
      continue;
    }
    if (event.direction === "min" && mark >= timeSeconds) {
      matched = points;
      break;
    }
    if (event.direction === "max" && mark <= timeSeconds) {
      matched = points;
      break;
    }
  }
  return matched;
}

export function buildPerformanceProfile(
  sex: ProfileSex,
  performances: readonly ProfilePerformanceInput[],
): ValidationResult<PerformanceProfile> {
  const errors = [];

  if (sex !== "M" && sex !== "W") {
    errors.push(validationError("sex", "invalid", "Choose men or women scoring tables."));
  }

  if (performances.length < 1) {
    errors.push(validationError("performances", "count", "Enter at least one PB."));
  }

  if (performances.length > 4) {
    errors.push(validationError("performances", "count", "Enter up to four PBs."));
  }

  const seen = new Set<string>();
  const scored: ProfilePerformanceScore[] = [];

  performances.forEach((performance, index) => {
    const field = `performance${index + 1}`;
    if (seen.has(performance.eventId)) {
      errors.push(
        validationError(`${field}Event`, "duplicate-event", "Each PB must be a different distance."),
      );
      return;
    }
    seen.add(performance.eventId);

    if (
      typeof performance.milliseconds !== "number" ||
      !Number.isFinite(performance.milliseconds) ||
      performance.milliseconds <= 0
    ) {
      errors.push(validationError(`${field}Time`, "invalid-time", "Enter a PB time greater than zero."));
      return;
    }

    const points = pointsForPerformance(sex, performance.eventId, performance.milliseconds / 1000);
    if (points === null) {
      errors.push(
        validationError(
          `${field}Event`,
          "unsupported-event",
          "Choose a supported distance for the selected scoring tables.",
        ),
      );
      return;
    }

    scored.push({
      eventId: performance.eventId,
      milliseconds: performance.milliseconds,
      points,
    });
  });

  if (errors.length > 0) {
    return invalidResult(errors);
  }

  const ranked = [...scored].sort((first, second) => second.points - first.points);
  const strongest = ranked[0];
  if (!strongest) {
    return invalidResult([validationError("performances", "count", "Enter at least one PB.")]);
  }

  return validResult({
    sex,
    edition: scoringTables.edition,
    performances: ranked,
    strongestEventId: strongest.eventId,
  });
}

export const profileGuideNote =
  "Points use the World Athletics outdoor scoring tables so different distances can be compared on one scale. Higher points indicate a relatively stronger performance.";
