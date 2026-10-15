import type { ParsedTime, ValidationError, ValidationResult } from "./types";
import { MILLISECONDS_PER_SECOND } from "./units";
import { invalidResult, validResult, validationError } from "./validation";

/**
 * Durations are integer milliseconds.
 * Structured fields are converted to the nearest millisecond once, on input.
 * Display rounding happens only in formatting.ts.
 * Display strings are never parsed.
 */

export type StructuredTimeInput = {
  hours?: unknown;
  minutes: unknown;
  seconds: unknown;
  fractionalSeconds?: unknown;
};

type ParsedField = {
  errors: ValidationError[];
  value?: number;
  provided: boolean;
};

function labelFor(name: string): string {
  if (name === "fractional seconds") {
    return "Fractional seconds";
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function parseField(
  value: unknown,
  fieldId: string,
  name: string,
  required: boolean,
  integer: boolean,
): ParsedField {
  if (value === undefined || value === null || value === "") {
    if (!required) {
      return { errors: [], provided: false };
    }
    return {
      errors: [validationError(fieldId, "required", `Enter the ${name}.`)],
      provided: false,
    };
  }

  if (typeof value !== "number") {
    return {
      errors: [validationError(fieldId, "unsupported", `Enter the ${name} as a number.`)],
      provided: true,
    };
  }

  if (Number.isNaN(value)) {
    return {
      errors: [validationError(fieldId, "not-a-number", `Enter a valid ${name} value.`)],
      provided: true,
    };
  }

  if (!Number.isFinite(value)) {
    return {
      errors: [validationError(fieldId, "not-finite", `Enter a finite ${name} value.`)],
      provided: true,
    };
  }

  if (value < 0) {
    return {
      errors: [validationError(fieldId, "negative", `${labelFor(name)} cannot be negative.`)],
      provided: true,
    };
  }

  if (integer && !Number.isInteger(value)) {
    return {
      errors: [validationError(fieldId, "not-integer", `Enter whole ${name}.`)],
      provided: true,
    };
  }

  return { errors: [], value, provided: true };
}

/** Turns one typed field into a number for structured parsing. Display strings such as 4:10 are left unchanged so they are rejected. */
export function readStructuredNumber(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  return Number(trimmed);
}

export function parseStructuredTime(input: StructuredTimeInput): ValidationResult<ParsedTime> {
  const hours = parseField(input.hours, "hours", "hours", false, true);
  const minutes = parseField(input.minutes, "minutes", "minutes", true, true);
  const seconds = parseField(input.seconds, "seconds", "seconds", true, false);
  const fractionalSeconds = parseField(
    input.fractionalSeconds,
    "fractionalSeconds",
    "fractional seconds",
    false,
    false,
  );

  const errors = [
    ...hours.errors,
    ...minutes.errors,
    ...seconds.errors,
    ...fractionalSeconds.errors,
  ];

  if (
    seconds.value !== undefined &&
    !Number.isInteger(seconds.value) &&
    fractionalSeconds.provided
  ) {
    errors.push(
      validationError(
        "fractionalSeconds",
        "ambiguous",
        "Enter the fraction either in seconds or in fractional seconds, not both.",
      ),
    );
  }

  if (fractionalSeconds.value !== undefined && fractionalSeconds.value >= 1) {
    errors.push(
      validationError(
        "fractionalSeconds",
        "out-of-range",
        "Fractional seconds must be less than 1.",
      ),
    );
  }

  const secondsMilliseconds =
    seconds.value === undefined
      ? undefined
      : Math.round((seconds.value + (fractionalSeconds.value ?? 0)) * MILLISECONDS_PER_SECOND);

  if (secondsMilliseconds !== undefined && secondsMilliseconds >= 60_000) {
    errors.push(
      validationError("seconds", "out-of-range", "Seconds must be less than 60."),
    );
  }

  if (errors.length > 0 || secondsMilliseconds === undefined || minutes.value === undefined) {
    return invalidResult(errors);
  }

  const milliseconds =
    (hours.value ?? 0) * 3_600_000 + minutes.value * 60_000 + secondsMilliseconds;

  if (milliseconds <= 0) {
    return invalidResult([
      validationError("seconds", "zero-duration", "Enter a time greater than zero."),
    ]);
  }

  return validResult({ milliseconds });
}
