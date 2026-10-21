import { presentRaceMetrics } from "../calculation/raceMetrics";
import type { RaceMetrics } from "../calculation/types";
import { Metric } from "./Metric";

type ResultPanelProps = {
  metrics: RaceMetrics;
};

export function ResultPanel({ metrics }: ResultPanelProps) {
  const presented = presentRaceMetrics(metrics);

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      <Metric label="Pace per km" value={presented.pacePerKilometre} primary />
      <Metric label="Pace per mile" value={presented.pacePerMile} />
      <Metric label="Speed km/h" value={presented.speedKilometresPerHour} />
      <Metric label="Speed mph" value={presented.speedMilesPerHour} />
      {presented.rhythms.map((rhythm) => (
        <Metric key={rhythm.metres} label={`Average ${rhythm.metres} m`} value={rhythm.time} />
      ))}
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </div>
  );
}
