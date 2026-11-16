import { presentAgeGrade, type AgeGradeResult } from "../calculation/ageGrade/ageGrade";
import { ShareableResult } from "../share/ShareableResult";
import type { ShareState } from "../share/shareState";
import { Metric } from "./Metric";

type AgeGradeResultPanelProps = {
  result: AgeGradeResult;
  share: ShareState;
};

export function AgeGradeResultPanel({ result, share }: AgeGradeResultPanelProps) {
  const presented = presentAgeGrade(result);

  return (
    <ShareableResult state={share}>
      <Metric label="Age-grade score" value={presented.percent} primary />
      <Metric label="Performance band" value={presented.band} />
      <Metric label="Open-equivalent time" value={presented.openEquivalent} />
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </ShareableResult>
  );
}
