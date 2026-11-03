import { eventById } from "../events";
import { formatPerformanceTime } from "../formatting";
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

export type ProfileZoneId =
  | "speed"
  | "speedMiddle"
  | "middle"
  | "middleEndurance"
  | "endurance";

export type ProfileShapeLabel =
  | "Speed focused"
  | "Speed / middle-distance"
  | "Middle-distance focused"
  | "Middle-distance / endurance"
  | "Endurance focused"
  | "Balanced";

export type PerformanceProfile = {
  sex: ProfileSex;
  edition: string;
  performances: readonly ProfilePerformanceScore[];
  /** Performances in the order the athlete entered them (for charts). */
  chartPerformances: readonly ProfilePerformanceScore[];
  strongestEventId: string;
  leadingEventIds: readonly string[];
  closelyMatched: boolean;
  shapeLabel: ProfileShapeLabel;
  /** 0 = speed end, 0.5 = middle, 1 = endurance end. */
  gaugePosition: number;
  interpretation: string;
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

/** Top scores within this many points are treated as closely matched. */
export const CLOSE_SCORE_POINTS = 10;

const BALANCED_MAX_ABS_DEVIATION = 15;
const BALANCED_ZONE_GAP = 8;

export const MIN_PROFILE_PERFORMANCES = 2;
export const MAX_PROFILE_PERFORMANCES = 6;

const ZONE_EVENTS: Record<ProfileZoneId, readonly string[]> = {
  speed: ["100", "200", "400"],
  speedMiddle: ["600", "800"],
  middle: ["1000", "1500", "mile"],
  middleEndurance: ["2000", "3000"],
  endurance: ["5000", "10k"],
};

const ZONE_ORDER: readonly ProfileZoneId[] = [
  "speed",
  "speedMiddle",
  "middle",
  "middleEndurance",
  "endurance",
];

const ZONE_LABEL: Record<Exclude<ProfileZoneId, never>, ProfileShapeLabel> = {
  speed: "Speed focused",
  speedMiddle: "Speed / middle-distance",
  middle: "Middle-distance focused",
  middleEndurance: "Middle-distance / endurance",
  endurance: "Endurance focused",
};

/** Collapse five zones onto the three-segment mock gauge (0…1). */
const ZONE_GAUGE_POSITION: Record<ProfileZoneId, number> = {
  speed: 0.12,
  speedMiddle: 0.28,
  middle: 0.5,
  middleEndurance: 0.72,
  endurance: 0.88,
};

export function supportedProfileEventIds(sex: ProfileSex = "M"): readonly string[] {
  return Object.keys(scoringTables.genders[sex]);
}

export function zoneForEvent(eventId: string): ProfileZoneId | null {
  for (const zone of ZONE_ORDER) {
    if (ZONE_EVENTS[zone].includes(eventId)) {
      return zone;
    }
  }
  return null;
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

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function deriveProfileShape(
  performances: readonly ProfilePerformanceScore[],
): Pick<
  PerformanceProfile,
  "shapeLabel" | "gaugePosition" | "closelyMatched" | "leadingEventIds" | "interpretation"
> {
  const ranked = [...performances].sort((first, second) => second.points - first.points);
  const strongest = ranked[0]!;
  const second = ranked[1];
  const closelyMatched =
    second !== undefined && strongest.points - second.points <= CLOSE_SCORE_POINTS;
  const leadingEventIds = closelyMatched
    ? ranked
        .filter((performance) => strongest.points - performance.points <= CLOSE_SCORE_POINTS)
        .map((performance) => performance.eventId)
    : [strongest.eventId];

  const scores = performances.map((performance) => performance.points);
  const scoreMean = mean(scores);
  const deviations = performances.map((performance) => ({
    eventId: performance.eventId,
    deviation: performance.points - scoreMean,
    zone: zoneForEvent(performance.eventId),
  }));

  const zoneScores = new Map<ProfileZoneId, number>();
  for (const zone of ZONE_ORDER) {
    const zoneDevs = deviations
      .filter((entry) => entry.zone === zone)
      .map((entry) => entry.deviation);
    if (zoneDevs.length > 0) {
      zoneScores.set(zone, mean(zoneDevs));
    }
  }

  const rankedZones = [...zoneScores.entries()].sort((a, b) => b[1] - a[1]);
  const primaryZone = rankedZones[0]?.[0] ?? "middle";
  const secondaryZoneScore = rankedZones[1]?.[1];
  const maxAbsDeviation = Math.max(...deviations.map((entry) => Math.abs(entry.deviation)), 0);

  const twoPbDifferentZonesClose =
    performances.length === 2 &&
    closelyMatched &&
    deviations[0]?.zone !== null &&
    deviations[1]?.zone !== null &&
    deviations[0]?.zone !== deviations[1]?.zone;

  const balanced =
    maxAbsDeviation < BALANCED_MAX_ABS_DEVIATION ||
    (secondaryZoneScore !== undefined &&
      Math.abs((rankedZones[0]?.[1] ?? 0) - secondaryZoneScore) <= BALANCED_ZONE_GAP) ||
    twoPbDifferentZonesClose;

  const shapeLabel: ProfileShapeLabel = balanced ? "Balanced" : ZONE_LABEL[primaryZone];
  const gaugePosition = balanced ? 0.5 : ZONE_GAUGE_POSITION[primaryZone];

  const interpretation = buildInterpretation({
    ranked,
    leadingEventIds,
    closelyMatched,
    shapeLabel,
    deviations,
  });

  return {
    shapeLabel,
    gaugePosition,
    closelyMatched,
    leadingEventIds,
    interpretation,
  };
}

function buildInterpretation(input: {
  ranked: readonly ProfilePerformanceScore[];
  leadingEventIds: readonly string[];
  closelyMatched: boolean;
  shapeLabel: ProfileShapeLabel;
  deviations: readonly { eventId: string; deviation: number; zone: ProfileZoneId | null }[];
}): string {
  const strongest = input.ranked[0]!;
  const strongestLabel = eventById(strongest.eventId).label;
  const strongestTime = formatPerformanceTime(strongest.milliseconds);

  let opening: string;
  if (input.closelyMatched && input.leadingEventIds.length > 1) {
    const leaders = input.leadingEventIds
      .map((eventId) => {
        const row = input.ranked.find((performance) => performance.eventId === eventId)!;
        return `${eventById(eventId).label} (${row.points} points)`;
      })
      .join(" and ");
    opening = `Your strongest relative performances are currently closely matched: ${leaders}.`;
  } else {
    opening = `Your strongest relative performance is currently the ${strongestLabel} (${strongest.points} points at ${strongestTime}).`;
  }

  const weakest = [...input.ranked].sort((a, b) => a.points - b.points)[0]!;
  const shapeSentence =
    input.shapeLabel === "Balanced"
      ? "Across the distances you entered, the scores currently look fairly balanced, with no clear lean towards speed or endurance."
      : `This currently suggests a ${input.shapeLabel.toLowerCase()} profile.`;

  let development = "";
  if (
    input.shapeLabel !== "Balanced" &&
    weakest.eventId !== strongest.eventId &&
    strongest.points - weakest.points > CLOSE_SCORE_POINTS
  ) {
    const weakLabel = eventById(weakest.eventId).label;
    const weakZone = zoneForEvent(weakest.eventId);
    const weakEnd =
      weakZone === "speed" || weakZone === "speedMiddle"
        ? "shorter"
        : weakZone === "endurance" || weakZone === "middleEndurance"
          ? "longer"
          : "middle-distance";
    development = ` Your ${weakLabel} (${weakest.points} points) currently scores lower, which may suggest the ${weakEnd} end of your profile has more room to develop.`;
  }

  return `${opening} ${shapeSentence}${development}`;
}

export function buildPerformanceProfile(
  sex: ProfileSex,
  performances: readonly ProfilePerformanceInput[],
): ValidationResult<PerformanceProfile> {
  const errors = [];

  if (sex !== "M" && sex !== "W") {
    errors.push(validationError("sex", "invalid", "Choose male or female scoring tables."));
  }

  if (performances.length < MIN_PROFILE_PERFORMANCES) {
    errors.push(
      validationError(
        "performances",
        "count",
        `Enter at least ${MIN_PROFILE_PERFORMANCES} PBs to build a profile.`,
      ),
    );
  }

  if (performances.length > MAX_PROFILE_PERFORMANCES) {
    errors.push(
      validationError(
        "performances",
        "count",
        `Enter up to ${MAX_PROFILE_PERFORMANCES} PBs.`,
      ),
    );
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
    return invalidResult([
      validationError(
        "performances",
        "count",
        `Enter at least ${MIN_PROFILE_PERFORMANCES} PBs to build a profile.`,
      ),
    ]);
  }

  const shape = deriveProfileShape(scored);

  return validResult({
    sex,
    edition: scoringTables.edition,
    performances: ranked,
    chartPerformances: scored,
    strongestEventId: strongest.eventId,
    ...shape,
  });
}

export const profileGuideNote =
  "Performance comparison based on World Athletics Scoring Tables. Higher points indicate a relatively stronger performance among the distances you entered.";
