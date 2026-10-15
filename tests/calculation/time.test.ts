import { describe, expect, it } from "vitest";
import { formatRaceTime, formatSplit } from "../../src/calculation/formatting";
import { parseStructuredTime } from "../../src/calculation/time";

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
      expect(blank.errors.map((error) => error.fieldId)).toEqual(["minutes", "seconds"]);
    }
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
});
