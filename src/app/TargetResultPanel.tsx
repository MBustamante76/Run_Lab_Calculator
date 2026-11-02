import { presentRaceMetrics } from "../calculation/raceMetrics";
import type { RaceMetrics } from "../calculation/types";
import { Metric } from "./Metric";

type TargetResultPanelProps = {
  metrics: RaceMetrics;
  sprintAverages?: boolean;
};

export function TargetResultPanel({ metrics, sprintAverages = false }: TargetResultPanelProps) {
  const presented = presentRaceMetrics(metrics, { sprintAverages });

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      <Metric label="Required pace per km" value={presented.pacePerKilometre} primary />
      <Metric label="Required pace per mile" value={presented.pacePerMile} />
      <Metric label="Speed km/h" value={presented.speedKilometresPerHour} />
      <Metric label="Speed mph" value={presented.speedMilesPerHour} />
      {presented.rhythms.map((rhythm) => (
        <Metric key={rhythm.metres} label={`Even ${rhythm.metres} m`} value={rhythm.time} />
      ))}
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </div>
  );
}
