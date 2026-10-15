import { eventById, events } from "./events";
import { formatPace, formatRaceTime, formatSpeed, formatSplit } from "./formatting";
import { calculateRaceMetrics } from "./raceMetrics";
import { parseStructuredTime } from "./time";
import type { RaceMetrics } from "./types";

function mustMetrics(distanceMetres: number, minutes: number, seconds: number): RaceMetrics {
  const parsed = parseStructuredTime({ minutes, seconds });
  if (!parsed.ok) {
    throw new Error(parsed.errors.map((error) => error.message).join(" "));
  }
  const metrics = calculateRaceMetrics(distanceMetres, parsed.value.milliseconds);
  if (!metrics.ok) {
    throw new Error(metrics.errors.map((error) => error.message).join(" "));
  }
  return metrics.value;
}

function rhythm(metrics: RaceMetrics, metres: number): string {
  const match = metrics.rhythms.find((candidate) => candidate.metres === metres);
  if (!match) {
    throw new Error(`Missing ${metres} m rhythm.`);
  }
  return formatSplit(match.milliseconds);
}

export function engineDiagnosticsLines(): readonly string[] {
  const fiveK = mustMetrics(eventById("5000").metres, 20, 0);
  const eightHundred = mustMetrics(eventById("800").metres, 2, 0);
  const invalidSeconds = parseStructuredTime({ minutes: 1, seconds: 60 });
  const invalidMessage = invalidSeconds.ok
    ? ""
    : invalidSeconds.errors.map((error) => error.message).join(" ");

  return [
    "Event catalogue",
    ...events.map(
      (event) =>
        `${event.id} | ${event.label} | ${event.metres} m | ${event.group} | ${event.supportedToolIds.join(", ")} | splits ${event.splitMetres.join(", ")} | route ${event.prediction.route}`,
    ),
    "5000 m in 20:00",
    `Total time: ${fiveK.totalTimeMilliseconds / 1000} s`,
    `Pace per km: ${formatPace(fiveK.pacePerKilometreMilliseconds)}`,
    `Pace per mile: ${formatPace(fiveK.pacePerMileMilliseconds)}`,
    `Speed: ${formatSpeed(fiveK.speedKilometresPerHour)} km/h`,
    `Speed: ${formatSpeed(fiveK.speedMilesPerHour)} mph`,
    `Average 400 m: ${rhythm(fiveK, 400)}`,
    "800 m in 2:00",
    `Average 100 m: ${rhythm(eightHundred, 100)}`,
    `Average 200 m: ${rhythm(eightHundred, 200)}`,
    `Average 400 m: ${rhythm(eightHundred, 400)}`,
    `Invalid seconds: ${invalidMessage}`,
    `Rounding carry: ${formatRaceTime(59_960)}`,
  ];
}
