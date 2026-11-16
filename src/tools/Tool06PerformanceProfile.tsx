import { useId, useRef, useState } from "react";
import { useAutoCalculate } from "../share/useAutoCalculate";
import { useShareState } from "../share/shareContext";
import { timeFieldsFromMilliseconds, type ShareState } from "../share/shareState";
import { ErrorSummary } from "../app/ErrorSummary";
import { FormLead } from "../app/FormLead";
import { ProfileResultPanel } from "../app/ProfileResultPanel";
import { useScrollIntoViewOnShow } from "../app/useScrollIntoViewOnShow";
import { events } from "../calculation/events";
import {
  buildPerformanceProfile,
  MAX_PROFILE_PERFORMANCES,
  MIN_PROFILE_PERFORMANCES,
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

function formFromShare(share: Extract<ShareState, { tool: "profile" }>): ProfileForm {
  return {
    sex: share.sex,
    performances: share.performances.map((row) => ({
      eventId: row.e,
      ...timeFieldsFromMilliseconds(row.t, true),
    })),
  };
}

export function Tool06PerformanceProfile() {
  const sexGroup = useId();
  const incoming = useShareState();
  const profileShare = incoming?.tool === "profile" ? incoming : null;
  const [form, setForm] = useState<ProfileForm>(() => (profileShare ? formFromShare(profileShare) : initialForm));
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const [profile, setProfile] = useState<PerformanceProfile | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [resultScroll, setResultScroll] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnShow(resultScroll, resultRef);
  useAutoCalculate(profileShare !== null, calculate);

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
      setShare(null);
      return;
    }

    const result = buildPerformanceProfile(form.sex, performances);
    if (!result.ok) {
      setErrors(result.errors);
      setProfile(null);
      setShare(null);
      return;
    }

    setErrors([]);
    setProfile(result.value);
    setShare({
      tool: "profile",
      sex: form.sex,
      performances: performances.map((row) => ({ e: row.eventId, t: row.milliseconds })),
    });
    setResultScroll((n) => n + 1);
  }

  function reset() {
    setForm(initialForm);
    setErrors([]);
    setProfile(null);
    setShare(null);
  }

  function editPerformances() {
    setProfile(null);
    setShare(null);
  }

  function addPb() {
    if (form.performances.length >= MAX_PROFILE_PERFORMANCES) {
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
    if (form.performances.length <= MIN_PROFILE_PERFORMANCES) {
      return;
    }
    setForm((current) => ({
      ...current,
      performances: current.performances.filter((_, rowIndex) => rowIndex !== index),
    }));
    setProfile(null);
  }

  if (profile) {
    return (
      <div ref={resultRef} className="run-lab-calculator__form run-lab-calculator__scroll-target">
        {share ? <ProfileResultPanel profile={profile} share={share} /> : null}
        <div className="run-lab-calculator__actions">
          <button type="button" className="run-lab-calculator__go" onClick={editPerformances}>
            Edit performances
          </button>
          <button type="button" className="run-lab-calculator__reset" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    );
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
      <FormLead toolId="profile" />
      <fieldset className="run-lab-calculator__units">
        <legend>Sex</legend>
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
          Male
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
          Female
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
              <p className="run-lab-calculator__pb-label">PB {index + 1}</p>
              <DistanceSelect
                id={`profile-distance-${index}`}
                label={`PB ${index + 1} distance`}
                events={available}
                value={row.eventId}
                error={messageFor(errors, `${prefix}Event`)}
                onChange={(eventId) => updatePb(index, { ...pbForEvent(eventId) })}
              />
              <fieldset className="run-lab-calculator__time">
                <legend>{`PB ${index + 1} time`}</legend>
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
              {form.performances.length > MIN_PROFILE_PERFORMANCES ? (
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
      {form.performances.length < MAX_PROFILE_PERFORMANCES ? (
        <button type="button" className="run-lab-calculator__reset run-lab-calculator__add" onClick={addPb}>
          + Add another performance
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
    </form>
  );
}
