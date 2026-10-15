type DurationParts = {
  hours: number;
  minutes: number;
  seconds: number;
  fraction: number;
  fractionDigits: 0 | 1;
};

function durationParts(milliseconds: number, fractionDigits: 0 | 1): DurationParts {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new Error("Duration must be a finite, non-negative number of milliseconds.");
  }

  const scale = fractionDigits === 1 ? 10 : 1;
  const units = Math.round(milliseconds / (1000 / scale));
  const fraction = fractionDigits === 1 ? units % 10 : 0;
  let wholeSeconds = Math.floor(units / scale);
  const hours = Math.floor(wholeSeconds / 3600);
  wholeSeconds %= 3600;
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;

  return { hours, minutes, seconds, fraction, fractionDigits };
}

function secondsText(parts: DurationParts): string {
  const seconds = String(parts.seconds).padStart(2, "0");
  if (parts.fractionDigits === 0) {
    return seconds;
  }
  return `${seconds}.${parts.fraction}`;
}

/** Race time with tenths. Rounding carries into the next minute or hour, so seconds never display as 60. */
export function formatRaceTime(milliseconds: number): string {
  const parts = durationParts(milliseconds, 1);
  const seconds = secondsText(parts);
  if (parts.hours > 0) {
    return `${parts.hours}:${String(parts.minutes).padStart(2, "0")}:${seconds}`;
  }
  return `${parts.minutes}:${seconds}`;
}

/** Finishing time. A zero tenth is omitted, so an exact 12:30 stays 12:30. */
export function formatFinishTime(milliseconds: number): string {
  const withTenths = formatRaceTime(milliseconds);
  return withTenths.endsWith(".0") ? withTenths.slice(0, -2) : withTenths;
}

/** Road pace in whole seconds. */
export function formatPace(milliseconds: number): string {
  const parts = durationParts(milliseconds, 0);
  const seconds = secondsText(parts);
  if (parts.hours > 0) {
    return `${parts.hours}:${String(parts.minutes).padStart(2, "0")}:${seconds}`;
  }
  return `${parts.minutes}:${seconds}`;
}

/** Track rhythm. Under a minute this stays in seconds with one tenth; 60.0 seconds carries to 1:00.0. */
export function formatSplit(milliseconds: number): string {
  return formatPerformanceTime(milliseconds);
}

/** A PB or predicted time: 25.0 under a minute, otherwise 2:10.0 or 1:02:03.0. */
export function formatPerformanceTime(milliseconds: number): string {
  const parts = durationParts(milliseconds, 1);
  if (parts.hours === 0 && parts.minutes === 0) {
    return `${parts.seconds}.${parts.fraction}`;
  }
  return formatRaceTime(milliseconds);
}

export function formatSpeed(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Speed must be a finite number.");
  }
  return value.toFixed(2);
}

/** `percent` is already a percentage, so 15.2 displays as 15.20%. */
export function formatPercentage(percent: number): string {
  if (!Number.isFinite(percent)) {
    throw new Error("Percentage must be a finite number.");
  }
  return `${percent.toFixed(2)}%`;
}
