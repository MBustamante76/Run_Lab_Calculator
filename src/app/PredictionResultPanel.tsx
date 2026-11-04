import { useId, useState } from "react";
import { eventById } from "../calculation/events";
import { formatPerformanceTime } from "../calculation/formatting";
import type { PredictionSuccess } from "../calculation/prediction/types";
import { presentRaceMetrics } from "../calculation/raceMetrics";
import type { RaceMetrics } from "../calculation/types";
import { Metric } from "./Metric";
import { PredictionRangeBar } from "./prediction/PredictionRangeBar";

type PredictionResultPanelProps = {
  result: PredictionSuccess;
  metrics: RaceMetrics;
};

function pbAttribution(result: PredictionSuccess): string {
  const parts = result.sourcePerformances.map((performance) => {
    const label = eventById(performance.eventId).label;
    return `your ${label} PB of ${formatPerformanceTime(performance.milliseconds)}`;
  });
  if (parts.length === 1) {
    return `Based on ${parts[0]}.`;
  }
  if (parts.length === 2) {
    return `Based on ${parts[0]} and ${parts[1]}.`;
  }
  return `Based on ${parts.join(", ")}.`;
}

export function PredictionResultPanel({ result, metrics }: PredictionResultPanelProps) {
  const presented = presentRaceMetrics(metrics);
  const [open, setOpen] = useState(false);
  const explanationId = useId();
  const attribution = pbAttribution(result);
  const target = eventById(result.targetEventId);
  const range = result.indicativeRange;
  const eyebrow = `Estimated ${target.label} performance`;

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      <div className="run-lab-calculator__estimate">
        <span>{eyebrow}</span>
        <b>
          {range.displayLow} – {range.displayHigh}
        </b>
        <div className="run-lab-calculator__range-central-row">
          <span>Central prediction</span>
          <strong>{range.displayCentral}</strong>
        </div>
        <PredictionRangeBar range={range} />
        <p className="run-lab-calculator__range-footnote">{range.footnote}</p>
        <p className="run-lab-calculator__method">{result.methodLabel}</p>
        <p className="run-lab-calculator__attribution">{attribution}</p>
      </div>
      {result.warnings.map((warning) => (
        <p key={warning.code} className="run-lab-calculator__warning">
          {warning.message}
        </p>
      ))}
      <Metric label="Pace per km" value={presented.pacePerKilometre} />
      <Metric label="Pace per mile" value={presented.pacePerMile} />
      <Metric label="Speed km/h" value={presented.speedKilometresPerHour} />
      <Metric label="Speed mph" value={presented.speedMilesPerHour} />
      {presented.rhythms.map((rhythm) => (
        <Metric key={rhythm.metres} label={`Average ${rhythm.metres} m`} value={rhythm.time} />
      ))}
      <div className="run-lab-calculator__how">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={explanationId}
          onClick={() => setOpen((current) => !current)}
        >
          How was this calculated?
        </button>
        {open ? <p id={explanationId}>{result.explanation}</p> : null}
      </div>
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </div>
  );
}
