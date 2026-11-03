import { eventById } from "../../calculation/events";
import { formatPerformanceTime } from "../../calculation/formatting";
import type { ProfilePerformanceScore } from "../../calculation/profile/worldAthleticsPoints";

type ProfileBarChartProps = {
  performances: readonly ProfilePerformanceScore[];
  leadingEventIds: readonly string[];
};

export function ProfileBarChart({ performances, leadingEventIds }: ProfileBarChartProps) {
  const points = performances.map((performance) => performance.points);
  const minPoints = Math.min(...points);
  const maxPoints = Math.max(...points);
  const pad = Math.max(20, Math.round((maxPoints - minPoints) * 0.15) || 20);
  const axisMin = Math.max(0, minPoints - pad);
  const axisMax = maxPoints + pad;
  const span = Math.max(axisMax - axisMin, 1);
  const leading = new Set(leadingEventIds);

  const chartLabel = performances
    .map((performance) => {
      const event = eventById(performance.eventId);
      return `${event.label} ${performance.points} points`;
    })
    .join("; ");

  return (
    <div
      className="run-lab-calculator__profile-chart"
      role="img"
      aria-label={`World Athletics score chart: ${chartLabel}`}
    >
      <div className="run-lab-calculator__profile-chart-plot">
        {performances.map((performance) => {
          const event = eventById(performance.eventId);
          const heightPct = ((performance.points - axisMin) / span) * 100;
          const isLeading = leading.has(performance.eventId);
          return (
            <div key={performance.eventId} className="run-lab-calculator__profile-chart-col">
              <span className="run-lab-calculator__profile-chart-value">{performance.points}</span>
              <div className="run-lab-calculator__profile-chart-track">
                <div
                  className={
                    isLeading
                      ? "run-lab-calculator__profile-chart-bar run-lab-calculator__profile-chart-bar--leading"
                      : "run-lab-calculator__profile-chart-bar"
                  }
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="run-lab-calculator__profile-chart-event">{event.label}</span>
              <span className="run-lab-calculator__profile-chart-time">
                {formatPerformanceTime(performance.milliseconds)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="run-lab-calculator__profile-chart-axis">WA score</p>
    </div>
  );
}
