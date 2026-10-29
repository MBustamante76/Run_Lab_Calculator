import { FieldError } from "./FieldError";
import { stepStructuredTime, type StructuredTimeParts } from "./timeStepping";

export type { StructuredTimeParts };

type TimeFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputMode: "numeric" | "decimal";
  onStep?: (delta: number) => void;
  stepLabel: string;
  fieldClassName?: string;
};

function TimeField({
  id,
  label,
  value,
  onChange,
  error,
  inputMode,
  onStep,
  stepLabel,
  fieldClassName,
}: TimeFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={`run-lab-calculator__field${fieldClassName ? ` ${fieldClassName}` : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="run-lab-calculator__stepper">
        {onStep ? (
          <button
            type="button"
            className="run-lab-calculator__stepper-btn"
            aria-label={`Decrease ${stepLabel}`}
            onClick={() => onStep(-1)}
          >
            −
          </button>
        ) : null}
        <input
          id={id}
          value={value}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {onStep ? (
          <button
            type="button"
            className="run-lab-calculator__stepper-btn"
            aria-label={`Increase ${stepLabel}`}
            onClick={() => onStep(1)}
          >
            +
          </button>
        ) : null}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

type StructuredTimeInputProps = {
  idPrefix: string;
  minutes: string;
  seconds: string;
  onMinutesChange: (value: string) => void;
  onSecondsChange: (value: string) => void;
  /** Atomic update used by steppers so minutes and seconds stay in sync. */
  onTimePartsChange: (parts: StructuredTimeParts) => void;
  minutesError?: string;
  secondsError?: string;
  hours?: string;
  onHoursChange?: (value: string) => void;
  hoursError?: string;
  showHours?: boolean;
};

export function StructuredTimeInput({
  idPrefix,
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  onTimePartsChange,
  minutesError,
  secondsError,
  hours = "",
  onHoursChange,
  hoursError,
  showHours = false,
}: StructuredTimeInputProps) {
  const withHours = showHours && typeof onHoursChange === "function";

  function applyStep(deltaSeconds: number) {
    onTimePartsChange(stepStructuredTime({ hours, minutes, seconds }, deltaSeconds, withHours));
  }

  return (
    <div className={`run-lab-calculator__row${withHours ? " run-lab-calculator__row--time-3" : ""}`}>
      {withHours ? (
        <TimeField
          id={`${idPrefix}-hours`}
          label="Hours"
          value={hours}
          inputMode="numeric"
          error={hoursError}
          stepLabel="hours"
          onChange={onHoursChange}
          onStep={(delta) => applyStep(delta * 3600)}
        />
      ) : null}
      <TimeField
        id={`${idPrefix}-minutes`}
        label="Minutes"
        value={minutes}
        inputMode="numeric"
        error={minutesError}
        stepLabel="minutes"
        onChange={onMinutesChange}
        onStep={(delta) => applyStep(delta * 60)}
      />
      <TimeField
        id={`${idPrefix}-seconds`}
        label="Seconds"
        value={seconds}
        inputMode="decimal"
        error={secondsError}
        stepLabel="seconds"
        fieldClassName="run-lab-calculator__field--seconds"
        onChange={onSecondsChange}
        onStep={(delta) => applyStep(delta)}
      />
    </div>
  );
}
