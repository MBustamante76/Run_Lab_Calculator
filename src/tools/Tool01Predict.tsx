import { useState } from "react";
import { eventById, events } from "../calculation/events";
import { predictPerformance } from "../calculation/prediction/PredictionEngine";
import type { PredictionSuccess } from "../calculation/prediction/types";
import { calculateRaceMetrics } from "../calculation/raceMetrics";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { RaceMetrics, ValidationError } from "../calculation/types";
import { ErrorSummary } from "../app/ErrorSummary";
import { PredictionResultPanel } from "../app/PredictionResultPanel";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const predictEvents = events.filter((event) => event.supportedToolIds.includes("predict"));

type PredictForm = {
  firstEventId: string;
  firstMinutes: string;
  firstSeconds: string;
  secondEnabled: boolean;
  secondEventId: string;
  secondMinutes: string;
  secondSeconds: string;
  targetEventId: string;
};

const emptyForm: PredictForm = {
  firstEventId: "1500",
  firstMinutes: "",
  firstSeconds: "",
  secondEnabled: false,
  secondEventId: "800",
  secondMinutes: "",
  secondSeconds: "",
  targetEventId: "3000",
};

type Outcome =
  | { status: "success"; result: PredictionSuccess; metrics: RaceMetrics }
  | { status: "unsupported"; message: string };

function messageFor(errors: readonly ValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}

function otherEventId(excluded: readonly string[]): string {
  const event = predictEvents.find((candidate) => !excluded.includes(candidate.id));
  return event?.id ?? predictEvents[0].id;
}

function withDistinctEvents(form: PredictForm): PredictForm {
  const secondEventId =
    form.secondEnabled && form.secondEventId === form.firstEventId
      ? otherEventId([form.firstEventId])
      : form.secondEventId;
  const taken = [form.firstEventId, ...(form.secondEnabled ? [secondEventId] : [])];
  const targetEventId = taken.includes(form.targetEventId) ? otherEventId(taken) : form.targetEventId;
  return { ...form, secondEventId, targetEventId };
}

function prefixTimeErrors(errors: readonly ValidationError[], prefix: "first" | "second"): ValidationError[] {
  return errors.map((error) => ({
    ...error,
    fieldId:
      error.fieldId === "minutes" ? `${prefix}Minutes` : error.fieldId === "seconds" ? `${prefix}Seconds` : error.fieldId,
  }));
}

export function Tool01Predict() {
  const [form, setForm] = useState<PredictForm>(emptyForm);
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  function update(next: PredictForm) {
    setForm(withDistinctEvents(next));
    setOutcome(null);
  }

  function calculate() {
    const collected: ValidationError[] = [];
    const performances: { eventId: string; milliseconds: number }[] = [];

    const firstParsed = parseStructuredTime({
      minutes: readStructuredNumber(form.firstMinutes),
      seconds: readStructuredNumber(form.firstSeconds),
    });
    if (!firstParsed.ok) {
      collected.push(...prefixTimeErrors(firstParsed.errors, "first"));
    } else {
      performances.push({ eventId: form.firstEventId, milliseconds: firstParsed.value.milliseconds });
    }

    if (form.secondEnabled) {
      const secondParsed = parseStructuredTime({
        minutes: readStructuredNumber(form.secondMinutes),
        seconds: readStructuredNumber(form.secondSeconds),
      });
      if (!secondParsed.ok) {
        collected.push(...prefixTimeErrors(secondParsed.errors, "second"));
      } else {
        performances.push({ eventId: form.secondEventId, milliseconds: secondParsed.value.milliseconds });
      }
    }

    if (collected.length > 0) {
      setErrors(collected);
      setOutcome(null);
      return;
    }

    const result = predictPerformance({ performances, targetEventId: form.targetEventId });
    if (result.status === "invalid") {
      setErrors(result.errors);
      setOutcome(null);
      return;
    }

    setErrors([]);
    if (result.status === "unsupported") {
      setOutcome({ status: "unsupported", message: result.explanation });
      return;
    }

    const metrics = calculateRaceMetrics(eventById(result.targetEventId).metres, result.predictedTimeMilliseconds);
    if (!metrics.ok) {
      setErrors(metrics.errors);
      setOutcome(null);
      return;
    }

    setOutcome({ status: "success", result, metrics: metrics.value });
  }

  function reset() {
    setForm(emptyForm);
    setErrors([]);
    setOutcome(null);
  }

  const targetEvents = predictEvents.filter(
    (event) => event.id !== form.firstEventId && (!form.secondEnabled || event.id !== form.secondEventId),
  );
  const secondEvents = predictEvents.filter((event) => event.id !== form.firstEventId);

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
        id="predict-pb"
        label="PB distance"
        events={predictEvents}
        value={form.firstEventId}
        error={messageFor(errors, "firstEvent")}
        onChange={(firstEventId) => update({ ...form, firstEventId })}
      />
      <fieldset className="run-lab-calculator__time">
        <legend>PB time</legend>
        <StructuredTimeInput
          idPrefix="predict-first"
          minutes={form.firstMinutes}
          seconds={form.firstSeconds}
          minutesError={messageFor(errors, "firstMinutes")}
          secondsError={messageFor(errors, "firstSeconds") ?? messageFor(errors, "firstTime")}
          onMinutesChange={(firstMinutes) => update({ ...form, firstMinutes })}
          onSecondsChange={(firstSeconds) => update({ ...form, firstSeconds })}
        />
      </fieldset>
      {form.secondEnabled ? (
        <div className="run-lab-calculator__second">
          <DistanceSelect
            id="predict-second-pb"
            label="Second PB distance"
            events={secondEvents}
            value={form.secondEventId}
            error={messageFor(errors, "secondEvent")}
            onChange={(secondEventId) => update({ ...form, secondEventId })}
          />
          <fieldset className="run-lab-calculator__time">
            <legend>Second PB time</legend>
            <StructuredTimeInput
              idPrefix="predict-second"
              minutes={form.secondMinutes}
              seconds={form.secondSeconds}
              minutesError={messageFor(errors, "secondMinutes")}
              secondsError={messageFor(errors, "secondSeconds") ?? messageFor(errors, "secondTime")}
              onMinutesChange={(secondMinutes) => update({ ...form, secondMinutes })}
              onSecondsChange={(secondSeconds) => update({ ...form, secondSeconds })}
            />
          </fieldset>
          <button
            type="button"
            className="run-lab-calculator__reset"
            onClick={() => update({ ...form, secondEnabled: false, secondMinutes: "", secondSeconds: "" })}
          >
            Remove second PB
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="run-lab-calculator__reset run-lab-calculator__add"
          onClick={() => update({ ...form, secondEnabled: true })}
        >
          Add a second PB
        </button>
      )}
      <DistanceSelect
        id="predict-target"
        label="Target distance"
        events={targetEvents}
        value={form.targetEventId}
        error={messageFor(errors, "target")}
        onChange={(targetEventId) => update({ ...form, targetEventId })}
      />
      <div className="run-lab-calculator__actions">
        <button type="submit" className="run-lab-calculator__go">
          Calculate my result
        </button>
        <button type="button" className="run-lab-calculator__reset" onClick={reset}>
          Reset
        </button>
      </div>
      {outcome?.status === "success" ? (
        <PredictionResultPanel result={outcome.result} metrics={outcome.metrics} />
      ) : null}
      {outcome?.status === "unsupported" ? (
        <p className="run-lab-calculator__unsupported" role="status">
          {outcome.message}
        </p>
      ) : null}
    </form>
  );
}
