import type { IndicativeRange } from "../../calculation/prediction/indicativeRange";

type PredictionRangeBarProps = {
  range: IndicativeRange;
};

/** Visual width of the amber band scales gently with ±% so wider bands read wider. */
function segmentWidthPercent(percent: number): number {
  return Math.min(56, Math.max(24, percent * 20));
}

export function PredictionRangeBar({ range }: PredictionRangeBarProps) {
  const width = segmentWidthPercent(range.percent);
  const left = (100 - width) / 2;

  return (
    <div
      className="run-lab-calculator__range-bar"
      role="img"
      aria-label={`Indicative range ${range.displayLow} to ${range.displayHigh}, central prediction ${range.displayCentral}`}
    >
      <div className="run-lab-calculator__range-bar-central">{range.displayCentral}</div>
      <div className="run-lab-calculator__range-bar-track">
        <div
          className="run-lab-calculator__range-bar-segment"
          style={{ left: `${left}%`, width: `${width}%` }}
        >
          <span className="run-lab-calculator__range-bar-marker" />
        </div>
      </div>
      <div className="run-lab-calculator__range-bar-ends" style={{ marginLeft: `${left}%`, width: `${width}%` }}>
        <span>{range.displayLow}</span>
        <span>{range.displayHigh}</span>
      </div>
    </div>
  );
}
