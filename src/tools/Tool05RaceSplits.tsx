import { useId, useState } from "react";
import { ErrorSummary } from "../app/ErrorSummary";
import { SplitsResultPanel } from "../app/SplitsResultPanel";
import {
  buildCheckpointPlan,
  type CheckpointPlan,
  type PacingStrategy,
  type SplitSpacing,
} from "../calculation/checkpoints";
import { eventById, events } from "../calculation/events";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { ValidationError } from "../calculation/types";
import { defaultTimeForEvent } from "../config/defaultTimes";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const splitsEvents = events.filter((event) => event.supportedToolIds.includes("splits"));

type SplitsForm = {
  eventId: string;
  pacingStrategy: PacingStrategy;
  splitSpacing: SplitSpacing;
  hours: string;
  minutes: string;
  seconds: string;
};

function formForEvent(eventId: string, extras?: Partial<SplitsForm>): SplitsForm {
  const time = defaultTimeForEvent(eventId);
  return {
    eventId,
    pacingStrategy: extras?.pacingStrategy ?? "even",
    splitSpacing: extras?.splitSpacing ?? "auto",
    hours: time.hours,
    minutes: time.minutes,
    seconds: time.seconds,
  };
}

const initialEventId = "5000";

function messageFor(errors: readonly ValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}

export function Tool05RaceSplits() {
  const strategyGroup = useId();
  const [form, setForm] = useState<SplitsForm>(() => formForEvent(initialEventId));
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [plan, setPlan] = useState<CheckpointPlan | null>(null);

  function calculate() {
    const parsed = parseStructuredTime({
      hours: readStructuredNumber(form.hours),
      minutes: readStructuredNumber(form.minutes),
      seconds: readStructuredNumber(form.seconds),
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      setPlan(null);
      return;
    }

    const result = buildCheckpointPlan(eventById(form.eventId).metres, parsed.value.milliseconds, {
      pacingStrategy: form.pacingStrategy,
      splitSpacing: form.splitSpacing,
    });
    if (!result.ok) {
      setErrors(result.errors);
      setPlan(null);
      return;
    }

    setErrors([]);
    setPlan(result.value);
  }

  function reset() {
    setForm(formForEvent(initialEventId));
    setErrors([]);
    setPlan(null);
  }

  return (
    <form
      className="run-lab-calculator__form"
      onSubmit={(event) => {
        event.preventDefault();
        calculate();
      }}
    >
      <ErrorSummary errors={errors} />
      <p className="run-lab-calculator__form-lead">
        Enter your race distance and goal finishing time to build checkpoint times. Choose even pace
        or a 2% negative split, and how often to mark the race.
      </p>
      <DistanceSelect
        id="splits-distance"
        label="Race distance"
        events={splitsEvents}
        value={form.eventId}
        error={messageFor(errors, "distance")}
        onChange={(eventId) => {
          setForm(formForEvent(eventId, form));
          setPlan(null);
        }}
      />
      <fieldset className="run-lab-calculator__units">
        <legend>Pacing strategy</legend>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={strategyGroup}
            checked={form.pacingStrategy === "even"}
            onChange={() => {
              setForm((current) => ({ ...current, pacingStrategy: "even" }));
              setPlan(null);
            }}
          />
          Even splits
        </label>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={strategyGroup}
            checked={form.pacingStrategy === "negative"}
            onChange={() => {
              setForm((current) => ({ ...current, pacingStrategy: "negative" }));
              setPlan(null);
            }}
          />
          Negative split (2%)
        </label>
      </fieldset>
      <div className="run-lab-calculator__field">
        <label htmlFor="splits-spacing">Checkpoint every</label>
        <select
          id="splits-spacing"
          value={form.splitSpacing}
          onChange={(event) => {
            setForm((current) => ({
              ...current,
              splitSpacing: event.target.value as SplitSpacing,
            }));
            setPlan(null);
          }}
        >
          <option value="auto">Auto</option>
          <option value="100">100 m</option>
          <option value="400">400 m</option>
          <option value="1000">1 km</option>
          <option value="mile">1 mile</option>
        </select>
      </div>
      <fieldset className="run-lab-calculator__time">
        <legend>Goal finishing time</legend>
        <StructuredTimeInput
          idPrefix="splits"
          showHours
          hours={form.hours}
          minutes={form.minutes}
          seconds={form.seconds}
          hoursError={messageFor(errors, "hours")}
          minutesError={messageFor(errors, "minutes")}
          secondsError={messageFor(errors, "seconds")}
          onHoursChange={(hours) => setForm((current) => ({ ...current, hours }))}
          onMinutesChange={(minutes) => setForm((current) => ({ ...current, minutes }))}
          onSecondsChange={(seconds) => setForm((current) => ({ ...current, seconds }))}
          onTimePartsChange={(parts) =>
            setForm((current) => ({
              ...current,
              hours: parts.hours ?? "",
              minutes: parts.minutes,
              seconds: parts.seconds,
            }))
          }
        />
      </fieldset>
      <div className="run-lab-calculator__actions">
        <button type="submit" className="run-lab-calculator__go">
          Calculate my result
        </button>
        <button type="button" className="run-lab-calculator__reset" onClick={reset}>
          Reset
        </button>
      </div>
      {plan ? <SplitsResultPanel plan={plan} /> : null}
    </form>
  );
}
