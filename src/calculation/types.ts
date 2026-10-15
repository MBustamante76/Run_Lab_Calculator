export type ValidationError = {
  fieldId: string;
  code: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      errors: ValidationError[];
    };

export type ParsedTime = {
  milliseconds: number;
};

export type RhythmMetres = 100 | 200 | 400;

export type RaceRhythm = {
  metres: RhythmMetres;
  milliseconds: number;
};

export type RaceMetrics = {
  totalTimeMilliseconds: number;
  pacePerKilometreMilliseconds: number;
  pacePerMileMilliseconds: number;
  speedKilometresPerHour: number;
  speedMilesPerHour: number;
  rhythms: readonly RaceRhythm[];
};
