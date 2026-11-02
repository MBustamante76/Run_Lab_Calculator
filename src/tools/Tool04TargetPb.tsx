import { useState } from "react";
import { ErrorSummary } from "../app/ErrorSummary";
import { TargetResultPanel } from "../app/TargetResultPanel";
import { eventById, events } from "../calculation/events";
import { calculateRaceMetrics } from "../calculation/raceMetrics";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { RaceMetrics, ValidationError } from "../calculation/types";
import { defaultTimeForEvent } from "../config/defaultTimes";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const targetEvents = events.filter((event) => event.supportedToolIds.includes("target"));

type TargetForm = {
  eventId: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function formForEvent(eventId: string): TargetForm {
  const time = defaultTimeForEvent(eventId);
  return {
    eventId,
    hours: time.hours,
    minutes: time.minutes,
    seconds: time.seconds,
  };
}

const initialEventId = "1500";

function messageFor(errors: readonly ValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}

export function Tool04TargetPb() {
  const [form, setForm] = useState<TargetForm>(() => formForEvent(initialEventId));
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [metrics, setMetrics] = useState<RaceMetrics | null>(null);

  function calculate() {
    const parsed = parseStructuredTime({
      hours: readStructuredNumber(form.hours),
      minutes: readStructuredNumber(form.minutes),
      seconds: readStructuredNumber(form.seconds),
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      setMetrics(null);
      return;
    }

    const result = calculateRaceMetrics(eventById(form.eventId).metres, parsed.value.milliseconds);
    if (!result.ok) {
      setErrors(result.errors);
      setMetrics(null);
      return;
    }

    setErrors([]);
    setMetrics(result.value);
  }

  function reset() {
    setForm(formForEvent(initialEventId));
    setErrors([]);
    setMetrics(null);
  }

  const selected = eventById(form.eventId);

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
        Enter the distance and target PB time to see the pace and even splits you need.
      </p>
      <DistanceSelect
        id="target-distance"
        label="Target distance"
        events={targetEvents}
        value={form.eventId}
        error={messageFor(errors, "distance")}
        onChange={(eventId) => {
          setForm(formForEvent(eventId));
          setMetrics(null);
        }}
      />
      <fieldset className="run-lab-calculator__time">
        <legend>Target PB time</legend>
        <StructuredTimeInput
          idPrefix="target"
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
      {metrics ? <TargetResultPanel metrics={metrics} sprintAverages={selected.group === "sprint"} /> : null}
    </form>
  );
}
