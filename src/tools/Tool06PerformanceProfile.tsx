import { useId, useState } from "react";
import { ErrorSummary } from "../app/ErrorSummary";
import { ProfileResultPanel } from "../app/ProfileResultPanel";
import { events } from "../calculation/events";
import {
  buildPerformanceProfile,
  type PerformanceProfile,
  type ProfileSex,
} from "../calculation/profile/worldAthleticsPoints";
import { parseStructuredTime, readStructuredNumber } from "../calculation/time";
import type { ValidationError } from "../calculation/types";
import { defaultTimeForEvent } from "../config/defaultTimes";
import { DistanceSelect } from "../fields/DistanceSelect";
import { StructuredTimeInput } from "../fields/StructuredTimeInput";

const profileEvents = events.filter((event) => event.supportedToolIds.includes("profile"));

type PbRow = {
  eventId: string;
  hours: string;
  minutes: string;
  seconds: string;
};

type ProfileForm = {
  sex: ProfileSex;
  performances: PbRow[];
};

function pbForEvent(eventId: string): PbRow {
  const time = defaultTimeForEvent(eventId);
  return {
    eventId,
    hours: time.hours,
    minutes: time.minutes,
    seconds: time.seconds,
  };
}

const initialForm: ProfileForm = {
  sex: "M",
  performances: [pbForEvent("1500"), pbForEvent("5000")],
};

function messageFor(errors: readonly ValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}

function prefixTimeErrors(
  errors: readonly ValidationError[],
  index: number,
): ValidationError[] {
  const prefix = `performance${index + 1}`;
  return errors.map((error) => ({
    ...error,
    fieldId:
      error.fieldId === "minutes"
        ? `${prefix}Minutes`
        : error.fieldId === "seconds"
          ? `${prefix}Seconds`
          : error.fieldId === "hours"
            ? `${prefix}Hours`
            : error.fieldId,
  }));
}

export function Tool06PerformanceProfile() {
  const sexGroup = useId();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [profile, setProfile] = useState<PerformanceProfile | null>(null);

  function updatePb(index: number, patch: Partial<PbRow>) {
    setForm((current) => ({
      ...current,
      performances: current.performances.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    }));
    setProfile(null);
  }

  function calculate() {
    const collected: ValidationError[] = [];
    const performances = form.performances.flatMap((row, index) => {
      const parsed = parseStructuredTime({
        hours: readStructuredNumber(row.hours),
        minutes: readStructuredNumber(row.minutes),
        seconds: readStructuredNumber(row.seconds),
      });
      if (!parsed.ok) {
        collected.push(...prefixTimeErrors(parsed.errors, index));
        return [];
      }
      return [{ eventId: row.eventId, milliseconds: parsed.value.milliseconds }];
    });

    if (collected.length > 0) {
      setErrors(collected);
      setProfile(null);
      return;
    }

    const result = buildPerformanceProfile(form.sex, performances);
    if (!result.ok) {
      setErrors(result.errors);
      setProfile(null);
      return;
    }

    setErrors([]);
    setProfile(result.value);
  }

  function reset() {
    setForm(initialForm);
    setErrors([]);
    setProfile(null);
  }

  function addPb() {
    if (form.performances.length >= 4) {
      return;
    }
    const used = new Set(form.performances.map((row) => row.eventId));
    const next = profileEvents.find((event) => !used.has(event.id)) ?? profileEvents[0];
    if (!next) {
      return;
    }
    setForm((current) => ({
      ...current,
      performances: [...current.performances, pbForEvent(next.id)],
    }));
    setProfile(null);
  }

  function removePb(index: number) {
    if (form.performances.length <= 1) {
      return;
    }
    setForm((current) => ({
      ...current,
      performances: current.performances.filter((_, rowIndex) => rowIndex !== index),
    }));
    setProfile(null);
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
        Enter one to four PBs to see which performances score highest on the World Athletics outdoor
        tables.
      </p>
      <fieldset className="run-lab-calculator__units">
        <legend>Scoring tables</legend>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={sexGroup}
            checked={form.sex === "M"}
            onChange={() => {
              setForm((current) => ({ ...current, sex: "M" }));
              setProfile(null);
            }}
          />
          Men
        </label>
        <label className="run-lab-calculator__unit">
          <input
            type="radio"
            name={sexGroup}
            checked={form.sex === "W"}
            onChange={() => {
              setForm((current) => ({ ...current, sex: "W" }));
              setProfile(null);
            }}
          />
          Women
        </label>
      </fieldset>
      {form.performances.map((row, index) => {
        const usedElsewhere = new Set(
          form.performances.filter((_, rowIndex) => rowIndex !== index).map((item) => item.eventId),
        );
        const available = profileEvents.filter(
          (event) => event.id === row.eventId || !usedElsewhere.has(event.id),
        );
        const prefix = `performance${index + 1}`;
        return (
          <div
            key={`${index}-${row.eventId}`}
            className={
              form.performances.length > 1 ? "run-lab-calculator__pb-group" : undefined
            }
          >
            <div className="run-lab-calculator__pb">
              {form.performances.length > 1 ? (
                <p className="run-lab-calculator__pb-label">PB {index + 1}</p>
              ) : null}
              <DistanceSelect
                id={`profile-distance-${index}`}
                label={form.performances.length > 1 ? `PB ${index + 1} distance` : "PB distance"}
                events={available}
                value={row.eventId}
                error={messageFor(errors, `${prefix}Event`)}
                onChange={(eventId) => updatePb(index, { ...pbForEvent(eventId) })}
              />
              <fieldset className="run-lab-calculator__time">
                <legend>{form.performances.length > 1 ? `PB ${index + 1} time` : "PB time"}</legend>
                <StructuredTimeInput
                  idPrefix={`profile-${index}`}
                  showHours
                  hours={row.hours}
                  minutes={row.minutes}
                  seconds={row.seconds}
                  hoursError={messageFor(errors, `${prefix}Hours`)}
                  minutesError={messageFor(errors, `${prefix}Minutes`)}
                  secondsError={messageFor(errors, `${prefix}Seconds`)}
                  onHoursChange={(hours) => updatePb(index, { hours })}
                  onMinutesChange={(minutes) => updatePb(index, { minutes })}
                  onSecondsChange={(seconds) => updatePb(index, { seconds })}
                  onTimePartsChange={(parts) =>
                    updatePb(index, {
                      hours: parts.hours ?? "",
                      minutes: parts.minutes,
                      seconds: parts.seconds,
                    })
                  }
                />
              </fieldset>
              {form.performances.length > 1 ? (
                <button
                  type="button"
                  className="run-lab-calculator__reset"
                  onClick={() => removePb(index)}
                >
                  Remove PB
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      {form.performances.length < 4 ? (
        <button type="button" className="run-lab-calculator__reset run-lab-calculator__add" onClick={addPb}>
          + Add another PB
        </button>
      ) : null}
      <div className="run-lab-calculator__actions">
        <button type="submit" className="run-lab-calculator__go">
          Calculate my result
        </button>
        <button type="button" className="run-lab-calculator__reset" onClick={reset}>
          Reset
        </button>
      </div>
      {profile ? <ProfileResultPanel profile={profile} /> : null}
    </form>
  );
}
