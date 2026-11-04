import { describe, expect, it } from "vitest";
import {
  bandPercentForEventId,
  bandPercentForTargetMetres,
  buildIndicativeRange,
} from "../../src/calculation/prediction/indicativeRange";
import { METRES_PER_MILE } from "../../src/calculation/units";

describe("indicativeRange", () => {
  it("maps Marcelo’s distance bands, with 1000m and mile at ±1.0%", () => {
    expect(bandPercentForEventId("100")).toBe(0.5);
    expect(bandPercentForEventId("200")).toBe(0.5);
    expect(bandPercentForEventId("400")).toBe(0.5);
    expect(bandPercentForEventId("600")).toBe(1.0);
    expect(bandPercentForEventId("800")).toBe(1.0);
    expect(bandPercentForEventId("1000")).toBe(1.0);
    expect(bandPercentForEventId("1500")).toBe(1.0);
    expect(bandPercentForEventId("mile")).toBe(1.0);
    expect(bandPercentForEventId("2000")).toBe(1.0);
    expect(bandPercentForEventId("3000")).toBe(1.5);
    expect(bandPercentForEventId("5000")).toBe(1.5);
    expect(bandPercentForEventId("10k")).toBe(1.5);
    expect(bandPercentForEventId("half")).toBe(2.0);
    expect(bandPercentForEventId("marathon")).toBe(2.0);

    expect(bandPercentForTargetMetres(1000)).toBe(1.0);
    expect(bandPercentForTargetMetres(METRES_PER_MILE)).toBe(1.0);
    expect(bandPercentForTargetMetres(3000)).toBe(1.5);
    expect(bandPercentForTargetMetres(21_097.5)).toBe(2.0);
  });

  it("builds a ±1.5% whole-second band around a 3000m central of 11:07.2", () => {
    const centralMs = (11 * 60 + 7.2) * 1000;
    const range = buildIndicativeRange(centralMs, 3000);

    expect(range.percent).toBe(1.5);
    expect(range.displayCentral).toBe("11:07");
    expect(range.displayLow).toBe("10:57");
    expect(range.displayHigh).toBe("11:17");
    expect(range.footnote).toBe(
      "Indicative performance range using ±1.5%, not a statistically validated uncertainty interval.",
    );
  });

  it("keeps tenths on short targets", () => {
    const range = buildIndicativeRange(120_000, 800);
    expect(range.percent).toBe(1.0);
    expect(range.displayCentral).toBe("2:00.0");
    expect(range.displayLow).toBe("1:58.8");
    expect(range.displayHigh).toBe("2:01.2");
  });
});
