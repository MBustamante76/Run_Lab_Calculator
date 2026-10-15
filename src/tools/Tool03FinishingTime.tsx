import { useId, useState } from "react";
import { eventById, events } from "../calculation/events";
import { finishingTimeMetrics, type PaceUnit } from "../calculation/finishingTime";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { RaceMetrics, ValidationError } from "../calculation/types";
import { ErrorSummary } from "../app/ErrorSummary";
import { FinishingResultPanel } from "../app/FinishingResultPanel";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const finishEvents = events.filter((event) => event.supportedToolIds.includes("finish"));

type FinishForm = {
  eventId: string;
  unit: PaceUnit;
  minutes: string;
  seconds: string;
};

const emptyForm: FinishForm = {
  eventId: "3000",
  unit: "kilometre",
  minutes: "",
  seconds: "",
};

function messageFor(errors: readonly ValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}

export function Tool03FinishingTime() {
  const unitGroup = useId();
  const [form, setForm] = useState<FinishForm>(emptyForm);
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [metrics, setMetrics] = useState<RaceMetrics | null>(null);
  const [resultUnit, setResultUnit] = useState<PaceUnit>("kilometre");

  function calculate() {
    const parsed = parseStructuredTime({
      minutes: readStructuredNumber(form.minutes),
      seconds: readStructuredNumber(form.seconds),
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      setMetrics(null);
      return;
    }

    const result = finishingTimeMetrics(
      eventById(form.eventId).metres,
      parsed.value.milliseconds,
      form.unit,
    );
    if (!result.ok) {
      setErrors(result.errors);
      setMetrics(null);
      return;
    }

    setErrors([]);
    setResultUnit(form.unit);
    setMetrics(result.value);
  }

  function reset() {
    setForm(emptyForm);
    setErrors([]);
    setMetrics(null);
    setResultUnit("kilometre");
  }

  function changeUnit(unit: PaceUnit) {
    setForm((current) => ({ ...current, unit }));
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
        id="finish-distance"
        label="Race distance"
        events={finishEvents}
        value={form.eventId}
        error={messageFor(errors, "distance")}
        onChange={(eventId) => {
          setForm((current) => ({ ...current, eventId }));
          setMetrics(null);
        }}
      />
      <fieldset className="run-lab-calculator__units">
        <legend>Pace unit</legend>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={unitGroup}
            checked={form.unit === "kilometre"}
            onChange={() => changeUnit("kilometre")}
          />
          Per kilometre
        </label>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={unitGroup}
            checked={form.unit === "mile"}
            onChange={() => changeUnit("mile")}
          />
          Per mile
        </label>
      </fieldset>
      <StructuredTimeInput
        idPrefix="finish"
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
      {metrics ? <FinishingResultPanel metrics={metrics} unit={resultUnit} /> : null}
    </form>
  );
}
