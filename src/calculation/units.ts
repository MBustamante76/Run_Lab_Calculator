/** One mile, in metres. The only place this constant is defined. */
export const METRES_PER_MILE = 1609.344;

export const METRES_PER_KILOMETRE = 1000;

export const MILLISECONDS_PER_SECOND = 1000;

export const MILLISECONDS_PER_HOUR = 3_600_000;

export function metresToKilometres(metres: number): number {
  return metres / METRES_PER_KILOMETRE;
}

export function metresToMiles(metres: number): number {
  return metres / METRES_PER_MILE;
}

export function pacePerKilometreMilliseconds(metres: number, milliseconds: number): number {
  return milliseconds / metresToKilometres(metres);
}

export function pacePerMileMilliseconds(metres: number, milliseconds: number): number {
  return milliseconds / metresToMiles(metres);
}

export function speedKilometresPerHour(metres: number, milliseconds: number): number {
  const hours = milliseconds / MILLISECONDS_PER_HOUR;
  return metresToKilometres(metres) / hours;
}

export function speedMilesPerHour(metres: number, milliseconds: number): number {
  const hours = milliseconds / MILLISECONDS_PER_HOUR;
  return metresToMiles(metres) / hours;
}
