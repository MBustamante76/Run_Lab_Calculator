import { useRef, useState } from "react";
import { useAutoCalculate } from "../share/useAutoCalculate";
import { useShareState } from "../share/shareContext";
import { timeFieldsFromMilliseconds, type ShareState } from "../share/shareState";
import { eventById, events } from "../calculation/events";
import { calculateRaceMetrics } from "../calculation/raceMetrics";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { RaceMetrics, ValidationError } from "../calculation/types";
import { ErrorSummary } from "../app/ErrorSummary";
import { FormLead } from "../app/FormLead";
import { ResultPanel } from "../app/ResultPanel";
import { useScrollIntoViewOnShow } from "../app/useScrollIntoViewOnShow";
import { defaultTimeForEvent } from "../config/defaultTimes";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const paceEvents = events.filter((event) => event.supportedToolIds.includes("pace"));

type PaceForm = {
  eventId: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function formForEvent(eventId: string): PaceForm {
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

export function Tool02RacePace() {
  const incoming = useShareState();
  const paceShare = incoming?.tool === "pace" ? incoming : null;
  const [form, setForm] = useState<PaceForm>(() =>
    paceShare
      ? { eventId: paceShare.e, ...timeFieldsFromMilliseconds(paceShare.t, true) }
      : formForEvent(initialEventId),
  );
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [metrics, setMetrics] = useState<RaceMetrics | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [resultScroll, setResultScroll] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnShow(resultScroll, resultRef);
  useAutoCalculate(paceShare !== null, calculate);

  function calculate() {
    const parsed = parseStructuredTime({
      hours: readStructuredNumber(form.hours),
      minutes: readStructuredNumber(form.minutes),
      seconds: readStructuredNumber(form.seconds),
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      setMetrics(null);
      setShare(null);
      return;
    }

    const result = calculateRaceMetrics(eventById(form.eventId).metres, parsed.value.milliseconds);
    if (!result.ok) {
      setErrors(result.errors);
      setMetrics(null);
      setShare(null);
      return;
    }

    setErrors([]);
    setMetrics(result.value);
    setShare({ tool: "pace", e: form.eventId, t: parsed.value.milliseconds });
    setResultScroll((n) => n + 1);
  }

  function reset() {
    setForm(formForEvent(initialEventId));
    setErrors([]);
    setMetrics(null);
    setShare(null);
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
      <FormLead toolId="pace" />
      <DistanceSelect
        id="pace-distance"
        label="Race distance"
        events={paceEvents}
        value={form.eventId}
        error={messageFor(errors, "distance")}
        onChange={(eventId) => {
          setForm(formForEvent(eventId));
          setMetrics(null);
        }}
      />
      <fieldset className="run-lab-calculator__time">
        <legend>Race time</legend>
        <StructuredTimeInput
          idPrefix="pace"
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
      {metrics ? (
        <div ref={resultRef} className="run-lab-calculator__scroll-target">
          {share ? (
            <ResultPanel metrics={metrics} sprintAverages={selected.group === "sprint"} share={share} />
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
