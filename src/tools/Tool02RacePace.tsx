import { useState } from "react";
import { eventById, events } from "../calculation/events";
import { calculateRaceMetrics } from "../calculation/raceMetrics";
import { parseStructuredTime } from "../calculation/time";
import type { RaceMetrics, ValidationError } from "../calculation/types";
import { ErrorSummary } from "../app/ErrorSummary";
import { ResultPanel } from "../app/ResultPanel";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const paceEvents = events.filter((event) => event.supportedToolIds.includes("pace"));

type PaceForm = {
  eventId: string;
  minutes: string;
  seconds: string;
};

const emptyForm: PaceForm = {
  eventId: "5000",
  minutes: "",
  seconds: "",
};

function fieldNumber(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  return Number(trimmed);
}

function messageFor(errors: readonly ValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}

export function Tool02RacePace() {
  const [form, setForm] = useState<PaceForm>(emptyForm);
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [metrics, setMetrics] = useState<RaceMetrics | null>(null);

  function calculate() {
    const parsed = parseStructuredTime({
      minutes: fieldNumber(form.minutes),
      seconds: fieldNumber(form.seconds),
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
    setForm(emptyForm);
    setErrors([]);
    setMetrics(null);
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
      <DistanceSelect
        id="pace-distance"
        label="Race distance"
        events={paceEvents}
        value={form.eventId}
        error={messageFor(errors, "distance")}
        onChange={(eventId) => setForm((current) => ({ ...current, eventId }))}
      />
      <StructuredTimeInput
        minutes={form.minutes}
        seconds={form.seconds}
        minutesError={messageFor(errors, "minutes")}
        secondsError={messageFor(errors, "seconds")}
        onMinutesChange={(minutes) => setForm((current) => ({ ...current, minutes }))}
        onSecondsChange={(seconds) => setForm((current) => ({ ...current, seconds }))}
      />
      <div className="run-lab-calculator__actions">
        <button type="submit" className="run-lab-calculator__go">
          Calculate my result
        </button>
        <button type="button" className="run-lab-calculator__reset" onClick={reset}>
          Reset
        </button>
      </div>
      {metrics ? <ResultPanel metrics={metrics} /> : null}
    </form>
  );
}
