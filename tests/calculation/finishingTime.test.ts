import { describe, expect, it } from "vitest";
import {
  deriveFinishingTime,
  finishingTimeMetrics,
  presentFinishingTime,
} from "../../src/calculation/finishingTime";
import { formatFinishTime } from "../../src/calculation/formatting";
import { parseStructuredTime } from "../../src/calculation/time";
import { METRES_PER_KILOMETRE, METRES_PER_MILE } from "../../src/calculation/units";

function pace(minutes: number, seconds: number): number {
  const parsed = parseStructuredTime({ minutes, seconds });
  if (!parsed.ok) {
    throw new Error("Expected a valid pace.");
  }
  return parsed.value.milliseconds;
}

describe("finishing time", () => {
  it("calculates 3000 m at 4:10 per km as 12:30", () => {
    const paceMilliseconds = pace(4, 10);
    expect(paceMilliseconds).toBe(250_000);
    const derived = deriveFinishingTime(3000, paceMilliseconds, "kilometre");
    expect(derived.ok && derived.value).toBe(750_000);
    expect(formatFinishTime(750_000)).toBe("12:30");

    const metrics = finishingTimeMetrics(3000, paceMilliseconds, "kilometre");
    if (!metrics.ok) {
      throw new Error("Expected metrics.");
    }
    expect(metrics.value.totalTimeMilliseconds).toBe(750_000);
    expect(presentFinishingTime(metrics.value, "kilometre").finishingTime).toBe("12:30");
    expect(metrics.value.pacePerKilometreMilliseconds).toBe(250_000);
  });

  it("keeps a mile at 8:00 per mile as 8:00", () => {
    const derived = deriveFinishingTime(METRES_PER_MILE, pace(8, 0), "mile");
    expect(derived.ok && derived.value).toBe(480_000);
    expect(formatFinishTime(480_000)).toBe("8:00");
  });

  it("matches a kilometre pace with the equivalent mile pace", () => {
    const pacePerKilometre = pace(5, 0);
    const pacePerMile = pacePerKilometre * (METRES_PER_MILE / METRES_PER_KILOMETRE);
    const fromKilometre = deriveFinishingTime(5000, pacePerKilometre, "kilometre");
    const fromMile = deriveFinishingTime(5000, pacePerMile, "mile");
    if (!fromKilometre.ok || !fromMile.ok) {
      throw new Error("Expected both finishing times to be valid.");
    }
    expect(fromKilometre.value).toBe(fromMile.value);
  });
});
