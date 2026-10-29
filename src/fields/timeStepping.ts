export type StructuredTimeParts = {
  hours?: string;
  minutes: string;
  seconds: string;
};

function parseNonNegative(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatSeconds(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Step total time by whole seconds, carrying across minutes (and hours when shown). */
export function stepStructuredTime(
  parts: { hours?: string; minutes: string; seconds: string },
  deltaSeconds: number,
  withHours: boolean,
): StructuredTimeParts {
  const hours = withHours ? parseNonNegative(parts.hours ?? "") : 0;
  const minutes = parseNonNegative(parts.minutes);
  const seconds = parseNonNegative(parts.seconds);
  let total = Math.max(0, hours * 3600 + minutes * 60 + seconds + deltaSeconds);

  let nextHours = 0;
  if (withHours) {
    nextHours = Math.floor(total / 3600);
    total %= 3600;
  }
  const nextMinutes = Math.floor(total / 60);
  const nextSeconds = total - nextMinutes * 60;

  return {
    ...(withHours ? { hours: String(nextHours) } : {}),
    minutes: String(nextMinutes),
    seconds: formatSeconds(nextSeconds),
  };
}
