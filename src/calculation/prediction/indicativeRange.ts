import { formatPredictedDisplayTime } from "../formatting";

/** Half marathon metres — encoded for completeness; not a Tool 01 target today. */
const METRES_PER_HALF = 21_097.5;

export type IndicativeRange = {
  percent: number;
  centralMilliseconds: number;
  lowMilliseconds: number;
  highMilliseconds: number;
  displayCentral: string;
  displayLow: string;
  displayHigh: string;
  footnote: string;
};

/**
 * Marcelo’s distance-based ±% table. 1000m and 1 Mile default to ±1.0% with the middle group.
 * Half/marathon and 100/200 are encoded even though Tool 01 does not offer them as targets.
 */
export function bandPercentForTargetMetres(metres: number): number {
  if (!Number.isFinite(metres) || metres <= 0) {
    throw new Error("Target metres must be a finite positive number.");
  }

  if (metres <= 400) {
    return 0.5;
  }
  if (metres < 3000) {
    return 1.0;
  }
  if (metres <= 10_000) {
    return 1.5;
  }
  if (metres >= METRES_PER_HALF - 1) {
    return 2.0;
  }
  return 1.5;
}

export function bandPercentForEventId(eventId: string): number {
  const byId: Record<string, number> = {
    "100": 0.5,
    "200": 0.5,
    "400": 0.5,
    "600": 1.0,
    "800": 1.0,
    "1000": 1.0,
    "1500": 1.0,
    mile: 1.0,
    "2000": 1.0,
    "3000": 1.5,
    "5000": 1.5,
    "10k": 1.5,
    half: 2.0,
    marathon: 2.0,
  };
  const percent = byId[eventId];
  if (percent === undefined) {
    throw new Error(`No indicative band configured for event "${eventId}".`);
  }
  return percent;
}

export function formatIndicativePercent(percent: number): string {
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}

export function buildIndicativeRange(centralMilliseconds: number, targetMetres: number): IndicativeRange {
  if (!Number.isFinite(centralMilliseconds) || centralMilliseconds <= 0) {
    throw new Error("Central prediction must be a finite positive duration.");
  }

  const percent = bandPercentForTargetMetres(targetMetres);
  const factor = percent / 100;
  const lowMilliseconds = centralMilliseconds * (1 - factor);
  const highMilliseconds = centralMilliseconds * (1 + factor);
  const displayCentral = formatPredictedDisplayTime(centralMilliseconds, targetMetres);
  const displayLow = formatPredictedDisplayTime(lowMilliseconds, targetMetres);
  const displayHigh = formatPredictedDisplayTime(highMilliseconds, targetMetres);
  const percentLabel = formatIndicativePercent(percent);

  return {
    percent,
    centralMilliseconds,
    lowMilliseconds,
    highMilliseconds,
    displayCentral,
    displayLow,
    displayHigh,
    footnote: `Indicative performance range using ±${percentLabel}%, not a statistically validated uncertainty interval.`,
  };
}
