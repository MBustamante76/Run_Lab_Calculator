import { useState } from "react";
import { ErrorSummary } from "../app/ErrorSummary";
import { SplitsResultPanel } from "../app/SplitsResultPanel";
import { buildEvenCheckpointPlan, type CheckpointPlan } from "../calculation/checkpoints";
import { eventById, events } from "../calculation/events";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { ValidationError } from "../calculation/types";
import { defaultTimeForEvent } from "../config/defaultTimes";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const splitsEvents = events.filter((event) => event.supportedToolIds.includes("splits"));

type SplitsForm = {
  eventId: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function formForEvent(eventId: string): SplitsForm {
  const time = defaultTimeForEvent(eventId);
  return {
    eventId,
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

    const result = buildEvenCheckpointPlan(eventById(form.eventId).metres, parsed.value.milliseconds);
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
        Enter your race distance and goal finishing time to build even-pace checkpoint times.
      </p>
      <DistanceSelect
        id="splits-distance"
        label="Race distance"
        events={splitsEvents}
        value={form.eventId}
        error={messageFor(errors, "distance")}
        onChange={(eventId) => {
          setForm(formForEvent(eventId));
          setPlan(null);
        }}
      />
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
