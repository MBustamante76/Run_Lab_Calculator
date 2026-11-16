import { presentFinishingTime, type PaceUnit } from "../calculation/finishingTime";
import type { RaceMetrics } from "../calculation/types";
import { ShareableResult } from "../share/ShareableResult";
import type { ShareState } from "../share/shareState";
import { Metric } from "./Metric";

type FinishingResultPanelProps = {
  metrics: RaceMetrics;
  unit: PaceUnit;
  share: ShareState;
};

export function FinishingResultPanel({ metrics, unit, share }: FinishingResultPanelProps) {
  const presented = presentFinishingTime(metrics, unit);

  return (
    <ShareableResult state={share}>
      <Metric label="Finishing time" value={presented.finishingTime} primary />
      <Metric label={presented.enteredPaceLabel} value={presented.enteredPace} />
      <Metric label={presented.convertedPaceLabel} value={presented.convertedPace} />
      <Metric label="Speed km/h" value={presented.speedKilometresPerHour} />
      <Metric label="Speed mph" value={presented.speedMilesPerHour} />
      {presented.rhythms.map((rhythm) => (
        <Metric key={rhythm.metres} label={`Average ${rhythm.metres} m`} value={rhythm.time} />
      ))}
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </ShareableResult>
  );
}
