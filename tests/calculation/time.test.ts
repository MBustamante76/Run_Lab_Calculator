import { describe, expect, it } from "vitest";
import { formatPredictedDisplayTime, formatRaceTime, formatSplit } from "../../src/calculation/formatting";
import { parseStructuredTime } from "../../src/calculation/time";
import { stepStructuredTime } from "../../src/fields/timeStepping";



describe("structured time", () => {
  it("parses 5:12 as 312 seconds", () => {
    const result = parseStructuredTime({ minutes: 5, seconds: 12 });
    expect(result.ok && result.value.milliseconds).toBe(312_000);
  });

  it("preserves 2:04.25", () => {
    const inSeconds = parseStructuredTime({ minutes: 2, seconds: 4.25 });
    const inFraction = parseStructuredTime({
      minutes: 2,
      seconds: 4,
      fractionalSeconds: 0.25,
    });
    expect(inSeconds.ok && inSeconds.value.milliseconds).toBe(124_250);
    expect(inFraction.ok && inFraction.value.milliseconds).toBe(124_250);
  });

  it("parses an hour-long value", () => {
    const result = parseStructuredTime({ hours: 1, minutes: 2, seconds: 3 });
    expect(result.ok && result.value.milliseconds).toBe(3_723_000);
  });

  it("rejects blank, zero, negative, 60 seconds, NaN and Infinity", () => {
    const blank = parseStructuredTime({ minutes: "", seconds: "" });
    const zero = parseStructuredTime({ minutes: 0, seconds: 0 });
    const negative = parseStructuredTime({ minutes: -1, seconds: 0 });
    const sixty = parseStructuredTime({ minutes: 1, seconds: 60 });
    const notANumber = parseStructuredTime({ minutes: Number.NaN, seconds: 1 });
    const infinite = parseStructuredTime({ minutes: Number.POSITIVE_INFINITY, seconds: 1 });

    expect(blank.ok).toBe(false);
    expect(zero.ok).toBe(false);
    expect(negative.ok).toBe(false);
    expect(sixty.ok).toBe(false);
    expect(notANumber.ok).toBe(false);
    expect(infinite.ok).toBe(false);

    if (!sixty.ok) {
      expect(sixty.errors.some((error) => error.message === "Seconds must be less than 60.")).toBe(true);
    }
    if (!blank.ok) {
      expect(blank.errors.map((error) => error.fieldId)).toEqual(["seconds"]);
    }
  });

  it("treats blank minutes as zero so sprint times can be seconds-only", () => {
    const result = parseStructuredTime({ minutes: "", seconds: 11.2 });
    expect(result.ok && result.value.milliseconds).toBe(11_200);
  });

  it("rejects display strings and ambiguous fractions", () => {
    const display = parseStructuredTime({ minutes: "5:12", seconds: 0 });
    const ambiguous = parseStructuredTime({
      minutes: 2,
      seconds: 4.25,
      fractionalSeconds: 0.25,
    });
    expect(display.ok).toBe(false);
    expect(ambiguous.ok).toBe(false);
    if (!ambiguous.ok) {
      expect(ambiguous.errors.some((error) => error.code === "ambiguous")).toBe(true);
    }
  });

  it("carries rounded seconds so the display never contains :60", () => {
    expect(formatRaceTime(59_960)).toBe("1:00.0");
    expect(formatSplit(60_000)).toBe("1:00.0");
    expect(formatRaceTime(3_599_960)).toBe("1:00:00.0");
    expect(formatRaceTime(59_960)).not.toContain(":60");
    expect(formatSplit(60_000)).not.toContain("60.0");
  });

  it("shows prediction tenths at or under 800m and whole seconds from 1000m up", () => {
    expect(formatPredictedDisplayTime(138_670, 800)).toBe("2:18.7");
    expect(formatPredictedDisplayTime(562_900, 1000)).toBe("9:23");
    expect(formatPredictedDisplayTime(562_900, 3000)).toBe("9:23");
  });

  it("steps minutes and seconds with carry", () => {
    expect(stepStructuredTime({ minutes: "1", seconds: "59" }, 1, false)).toEqual({
      minutes: "2",
      seconds: "0",
    });
    expect(stepStructuredTime({ hours: "0", minutes: "59", seconds: "30" }, 60, true)).toEqual({
      hours: "1",
      minutes: "0",
      seconds: "30",
    });
  });
});

