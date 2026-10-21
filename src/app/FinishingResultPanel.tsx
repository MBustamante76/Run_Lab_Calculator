import { presentFinishingTime, type PaceUnit } from "../calculation/finishingTime";
import type { RaceMetrics } from "../calculation/types";
import { Metric } from "./Metric";

type FinishingResultPanelProps = {
  metrics: RaceMetrics;
  unit: PaceUnit;
};

export function FinishingResultPanel({ metrics, unit }: FinishingResultPanelProps) {
  const presented = presentFinishingTime(metrics, unit);

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      <Metric label="Finishing time" value={presented.finishingTime} primary />
      <Metric label={presented.enteredPaceLabel} value={presented.enteredPace} />
      <Metric label={presented.convertedPaceLabel} value={presented.convertedPace} />
      <Metric label="Speed km/h" value={presented.speedKilometresPerHour} />
      <Metric label="Speed mph" value={presented.speedMilesPerHour} />
      {presented.rhythms.map((rhythm) => (
        <Metric key={rhythm.metres} label={`Average ${rhythm.metres} m`} value={rhythm.time} />
      ))}
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </div>
  );
}
