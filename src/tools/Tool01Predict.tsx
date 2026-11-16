import { useRef, useState } from "react";
import { useAutoCalculate } from "../share/useAutoCalculate";
import { useShareState } from "../share/shareContext";
import { timeFieldsFromMilliseconds, type ShareState } from "../share/shareState";
import { eventById, events } from "../calculation/events";
import { predictPerformance } from "../calculation/prediction/PredictionEngine";
import type { PredictionSuccess } from "../calculation/prediction/types";
import { calculateRaceMetrics } from "../calculation/raceMetrics";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { RaceMetrics, ValidationError } from "../calculation/types";
import { ErrorSummary } from "../app/ErrorSummary";
import { FormLead } from "../app/FormLead";
import { PredictionResultPanel } from "../app/PredictionResultPanel";
import { useScrollIntoViewOnShow } from "../app/useScrollIntoViewOnShow";
import {
  candidatePairingNotice,
  isCandidateEventPair,
} from "../config/candidateEventPairs";
import { defaultTimeForEvent } from "../config/defaultTimes";
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

function initialForm(): PredictForm {
  const first = defaultTimeForEvent("1500");
  const second = defaultTimeForEvent("800");
  return {
    firstEventId: "1500",
    firstMinutes: first.minutes,
    firstSeconds: first.seconds,
    secondEnabled: false,
    secondEventId: "800",
    secondMinutes: second.minutes,
    secondSeconds: second.seconds,
    targetEventId: "3000",
  };
}


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

function unsupportedMessageFor(
  explanation: string,
  performances: readonly { eventId: string }[],
  targetEventId: string,
): string {
  if (performances.length === 1 && isCandidateEventPair(performances[0].eventId, targetEventId)) {
    return `${explanation} ${candidatePairingNotice}`;
  }
  return explanation;
}

function formFromShare(share: Extract<ShareState, { tool: "predict" }>): PredictForm {
  const first = timeFieldsFromMilliseconds(share.t1, false);
  const second = share.t2 !== undefined ? timeFieldsFromMilliseconds(share.t2, false) : defaultTimeForEvent("800");
  return {
    firstEventId: share.e1,
    firstMinutes: first.minutes,
    firstSeconds: first.seconds,
    secondEnabled: share.e2 !== undefined && share.t2 !== undefined,
    secondEventId: share.e2 ?? "800",
    secondMinutes: second.minutes,
    secondSeconds: second.seconds,
    targetEventId: share.target,
  };
}

export function Tool01Predict() {
  const incoming = useShareState();
  const predictShare = incoming?.tool === "predict" ? incoming : null;
  const [form, setForm] = useState<PredictForm>(() => (predictShare ? formFromShare(predictShare) : initialForm()));

  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [resultScroll, setResultScroll] = useState(0);
  const outcomeRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnShow(resultScroll, outcomeRef);
  useAutoCalculate(predictShare !== null, calculate);

  function update(next: PredictForm) {
    setForm(withDistinctEvents(next));
    setOutcome(null);
    setShare(null);
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
      setShare(null);
      return;
    }

    const result = predictPerformance({ performances, targetEventId: form.targetEventId });
    if (result.status === "invalid") {
      setErrors(result.errors);
      setOutcome(null);
      setShare(null);
      return;
    }

    setErrors([]);
    if (result.status === "unsupported") {
      setOutcome({
        status: "unsupported",
        message: unsupportedMessageFor(result.explanation, performances, form.targetEventId),
      });
      setShare(null);
      setResultScroll((n) => n + 1);
      return;
    }

    const metrics = calculateRaceMetrics(eventById(result.targetEventId).metres, result.predictedTimeMilliseconds);
    if (!metrics.ok) {
      setErrors(metrics.errors);
      setOutcome(null);
      setShare(null);
      return;
    }

    setOutcome({ status: "success", result, metrics: metrics.value });
    setShare({
      tool: "predict",
      e1: performances[0].eventId,
      t1: performances[0].milliseconds,
      target: form.targetEventId,
      ...(performances[1]
        ? { e2: performances[1].eventId, t2: performances[1].milliseconds }
        : {}),
    });
    setResultScroll((n) => n + 1);
  }

  function reset() {
    setForm(initialForm());
    setErrors([]);
    setOutcome(null);
    setShare(null);
  }

  function setFirstDistance(firstEventId: string) {
    const time = defaultTimeForEvent(firstEventId);
    update({ ...form, firstEventId, firstMinutes: time.minutes, firstSeconds: time.seconds });
  }

  function setSecondDistance(secondEventId: string) {
    const time = defaultTimeForEvent(secondEventId);
    update({ ...form, secondEventId, secondMinutes: time.minutes, secondSeconds: time.seconds });
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
      <FormLead toolId="predict" />
      <ErrorSummary errors={errors} />
      <div className={form.secondEnabled ? "run-lab-calculator__pb-group" : undefined}>
        <div className="run-lab-calculator__pb">
          {form.secondEnabled ? <p className="run-lab-calculator__pb-label">PB 1</p> : null}
          <DistanceSelect
            id="predict-pb"
            label="PB distance"
            events={predictEvents}
            value={form.firstEventId}
            error={messageFor(errors, "firstEvent")}
            onChange={setFirstDistance}
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
              onTimePartsChange={(parts) =>
                update({ ...form, firstMinutes: parts.minutes, firstSeconds: parts.seconds })
              }
            />

          </fieldset>
        </div>
        {form.secondEnabled ? (
          <div className="run-lab-calculator__pb run-lab-calculator__pb--second">
            <p className="run-lab-calculator__pb-label">PB 2 · optional</p>
            <DistanceSelect
              id="predict-second-pb"
              label="Second PB distance"
              events={secondEvents}
              value={form.secondEventId}
              error={messageFor(errors, "secondEvent")}
              onChange={setSecondDistance}
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
                onTimePartsChange={(parts) =>
                  update({ ...form, secondMinutes: parts.minutes, secondSeconds: parts.seconds })
                }
              />

            </fieldset>
            <button
              type="button"
              className="run-lab-calculator__reset"
              onClick={() => {
                const time = defaultTimeForEvent(form.secondEventId);
                update({
                  ...form,
                  secondEnabled: false,
                  secondMinutes: time.minutes,
                  secondSeconds: time.seconds,
                });
              }}
            >
              Remove second PB
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="run-lab-calculator__reset run-lab-calculator__add"
            onClick={() => {
              const time = defaultTimeForEvent(form.secondEventId);
              update({
                ...form,
                secondEnabled: true,
                secondMinutes: time.minutes,
                secondSeconds: time.seconds,
              });
            }}
          >
            + Add another PB
          </button>
        )}

      </div>
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
      {outcome ? (
        <div ref={outcomeRef} className="run-lab-calculator__scroll-target">
          {outcome.status === "success" && share ? (
            <PredictionResultPanel result={outcome.result} metrics={outcome.metrics} share={share} />
          ) : outcome.status === "unsupported" ? (
            <p className="run-lab-calculator__unsupported" role="status">
              {outcome.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
