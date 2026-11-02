import { presentCheckpointPlan, type CheckpointPlan } from "../calculation/checkpoints";
import { Metric } from "./Metric";

type SplitsResultPanelProps = {
  plan: CheckpointPlan;
};

export function SplitsResultPanel({ plan }: SplitsResultPanelProps) {
  const presented = presentCheckpointPlan(plan);

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      {presented.checkpoints.map((checkpoint) => (
        <Metric
          key={checkpoint.metres}
          label={`${checkpoint.label} · cumulative`}
          value={checkpoint.cumulative}
          primary={checkpoint.label === "Finish"}
        />
      ))}
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </div>
  );
}
