import { presentCheckpointPlan, type CheckpointPlan } from "../calculation/checkpoints";
import { ShareableResult } from "../share/ShareableResult";
import type { ShareState } from "../share/shareState";
import { Metric } from "./Metric";

type SplitsResultPanelProps = {
  plan: CheckpointPlan;
  share: ShareState;
};

export function SplitsResultPanel({ plan, share }: SplitsResultPanelProps) {
  const presented = presentCheckpointPlan(plan);

  return (
    <ShareableResult state={share}>
      {presented.checkpoints.map((checkpoint) => (
        <Metric
          key={checkpoint.metres}
          label={`${checkpoint.label} · cumulative`}
          value={checkpoint.cumulative}
          primary={checkpoint.label === "Finish"}
        />
      ))}
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </ShareableResult>
  );
}
