import type { ValidationError, ValidationResult } from "./types";

export function validationError(
  fieldId: string,
  code: string,
  message: string,
): ValidationError {
  return { fieldId, code, message };
}

export function invalidResult<T>(
  errors: readonly ValidationError[],
): ValidationResult<T> {
  return { ok: false, errors: [...errors] };
}

export function validResult<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}
