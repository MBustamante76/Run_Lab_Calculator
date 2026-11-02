import { presentAgeGrade, type AgeGradeResult } from "../calculation/ageGrade/ageGrade";
import { Metric } from "./Metric";

type AgeGradeResultPanelProps = {
  result: AgeGradeResult;
};

export function AgeGradeResultPanel({ result }: AgeGradeResultPanelProps) {
  const presented = presentAgeGrade(result);

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      <Metric label="Age-grade score" value={presented.percent} primary />
      <Metric label="Performance band" value={presented.band} />
      <Metric label="Open-equivalent time" value={presented.openEquivalent} />
      <p className="run-lab-calculator__result-note">{presented.note}</p>
    </div>
  );
}
