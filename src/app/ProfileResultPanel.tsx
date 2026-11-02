import { eventById } from "../calculation/events";
import { formatPerformanceTime } from "../calculation/formatting";
import {
  profileGuideNote,
  type PerformanceProfile,
} from "../calculation/profile/worldAthleticsPoints";
import { Metric } from "./Metric";

type ProfileResultPanelProps = {
  profile: PerformanceProfile;
};

export function ProfileResultPanel({ profile }: ProfileResultPanelProps) {
  const sexLabel = profile.sex === "M" ? "men" : "women";

  return (
    <div className="run-lab-calculator__result" aria-live="polite">
      {profile.performances.map((performance, index) => {
        const event = eventById(performance.eventId);
        const isStrongest = performance.eventId === profile.strongestEventId;
        return (
          <Metric
            key={`${performance.eventId}-${performance.milliseconds}`}
            label={`${isStrongest ? "Strongest · " : ""}${event.label} (${formatPerformanceTime(performance.milliseconds)})`}
            value={`${performance.points} pts`}
            primary={index === 0}
          />
        );
      })}
      <p className="run-lab-calculator__result-note">
        {profileGuideNote} Tables: {profile.edition} ({sexLabel}).
      </p>
    </div>
  );
}
