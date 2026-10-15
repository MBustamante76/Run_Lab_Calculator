import type { EventDefinition } from "../calculation/events";
import { FieldError } from "./FieldError";

type DistanceSelectProps = {
  id: string;
  label: string;
  events: readonly EventDefinition[];
  value: string;
  onChange: (eventId: string) => void;
  error?: string;
};

export function DistanceSelect({ id, label, events, value, onChange, error }: DistanceSelectProps) {
  const errorId = `${id}-error`;

  return (
    <div className="run-lab-calculator__field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {events.map((race) => (
          <option key={race.id} value={race.id}>
            {race.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
