import { useId, useState } from "react";
import { AgeGradeResultPanel } from "../app/AgeGradeResultPanel";
import { ErrorSummary } from "../app/ErrorSummary";
import {
  ageGradeDistances,
  calculateAgeGrade,
  type AgeGradeDistanceId,
  type AgeGradeResult,
  type AgeGradeSex,
} from "../calculation/ageGrade/ageGrade";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { ValidationError } from "../calculation/types";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

type AgeGradeForm = {
  sex: AgeGradeSex;
  age: string;
  distanceId: AgeGradeDistanceId;
  hours: string;
  minutes: string;
  seconds: string;
};

const initialForm: AgeGradeForm = {
  sex: "M",
  age: "45",
  distanceId: "5k",
  hours: "",
  minutes: "22",
  seconds: "0",
};

function messageFor(errors: readonly ValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}

export function Tool07AgeGrade() {
  const sexGroup = useId();
  const [form, setForm] = useState<AgeGradeForm>(initialForm);
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [result, setResult] = useState<AgeGradeResult | null>(null);

  function calculate() {
    const parsed = parseStructuredTime({
      hours: readStructuredNumber(form.hours),
      minutes: readStructuredNumber(form.minutes),
      seconds: readStructuredNumber(form.seconds),
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      setResult(null);
      return;
    }

    const age = Number(form.age);
    const graded = calculateAgeGrade({
      sex: form.sex,
      age: Number.isFinite(age) ? age : Number.NaN,
      distanceId: form.distanceId,
      milliseconds: parsed.value.milliseconds,
    });

    if (!graded.ok) {
      setErrors(graded.errors);
      setResult(null);
      return;
    }

    setErrors([]);
    setResult(graded.value);
  }

  function reset() {
    setForm(initialForm);
    setErrors([]);
    setResult(null);
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
        Enter sex, age, distance and race time to see your age-grade percentage on the 2025 road
        standards.
      </p>
      <fieldset className="run-lab-calculator__units">
        <legend>Sex</legend>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={sexGroup}
            checked={form.sex === "M"}
            onChange={() => {
              setForm((current) => ({ ...current, sex: "M" }));
              setResult(null);
            }}
          />
          Male
        </label>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={sexGroup}
            checked={form.sex === "W"}
            onChange={() => {
              setForm((current) => ({ ...current, sex: "W" }));
              setResult(null);
            }}
          />
          Female
        </label>
      </fieldset>
      <div className="run-lab-calculator__field">
        <label htmlFor="age-grade-age">Age on race day</label>
        <input
          id="age-grade-age"
          type="number"
          min={5}
          max={100}
          step={1}
          value={form.age}
          aria-invalid={messageFor(errors, "age") ? true : undefined}
          onChange={(event) => {
            setForm((current) => ({ ...current, age: event.target.value }));
            setResult(null);
          }}
        />
        {messageFor(errors, "age") ? (
          <p className="run-lab-calculator__field-error">{messageFor(errors, "age")}</p>
        ) : null}
      </div>
      <div className="run-lab-calculator__field">
        <label htmlFor="age-grade-distance">Race distance</label>
        <select
          id="age-grade-distance"
          value={form.distanceId}
          onChange={(event) => {
            setForm((current) => ({
              ...current,
              distanceId: event.target.value as AgeGradeDistanceId,
            }));
            setResult(null);
          }}
        >
          {ageGradeDistances.map((distance) => (
            <option key={distance.id} value={distance.id}>
              {distance.label}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="run-lab-calculator__time">
        <legend>Race time</legend>
        <StructuredTimeInput
          idPrefix="age-grade"
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
      {result ? <AgeGradeResultPanel result={result} /> : null}
    </form>
  );
}
