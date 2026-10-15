import { FieldError } from "./FieldError";

type TimeFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputMode: "numeric" | "decimal";
};

function TimeField({ id, label, value, onChange, error, inputMode }: TimeFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="run-lab-calculator__field">
      <label htmlFor={id}>{label}</label>
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
      <FieldError id={errorId} message={error} />
    </div>
  );
}

type StructuredTimeInputProps = {
  minutes: string;
  seconds: string;
  onMinutesChange: (value: string) => void;
  onSecondsChange: (value: string) => void;
  minutesError?: string;
  secondsError?: string;
};

export function StructuredTimeInput({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  minutesError,
  secondsError,
}: StructuredTimeInputProps) {
  return (
    <div className="run-lab-calculator__row">
      <TimeField
        id="pace-minutes"
        label="Minutes"
        value={minutes}
        inputMode="numeric"
        error={minutesError}
        onChange={onMinutesChange}
      />
      <TimeField
        id="pace-seconds"
        label="Seconds"
        value={seconds}
        inputMode="decimal"
        error={secondsError}
        onChange={onSecondsChange}
      />
    </div>
  );
}
