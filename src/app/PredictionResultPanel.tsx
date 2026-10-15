import { useId, useState } from "react";
import { estimatedEquivalentLabel } from "../calculation/prediction/PredictionEngine";
import type { PredictionSuccess } from "../calculation/prediction/types";
import { presentRaceMetrics } from "../calculation/raceMetrics";
import type { RaceMetrics } from "../calculation/types";
import { Metric } from "./Metric";

type PredictionResultPanelProps = {
  result: PredictionSuccess;
  metrics: RaceMetrics;
};

export function PredictionResultPanel({ result, metrics }: PredictionResultPanelProps) {
  const presented = presentRaceMetrics(metrics);
  const [open, setOpen] = useState(false);
  const explanationId = useId();

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      <div className="run-lab-calculator__estimate">
        <span>{estimatedEquivalentLabel}</span>
        <b>{result.displayTime}</b>
        <p className="run-lab-calculator__method">{result.methodLabel}</p>
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
