import { eventById } from "../calculation/events";
import { formatPerformanceTime } from "../calculation/formatting";
import {
  profileGuideNote,
  type PerformanceProfile,
} from "../calculation/profile/worldAthleticsPoints";
import { Metric } from "./Metric";
import { ProfileBarChart } from "./profile/ProfileBarChart";
import { ProfileGauge } from "./profile/ProfileGauge";

type ProfileResultPanelProps = {
  profile: PerformanceProfile;
};

export function ProfileResultPanel({ profile }: ProfileResultPanelProps) {
  const sexLabel = profile.sex === "M" ? "male" : "female";
  const strongest = profile.performances.find(
    (performance) => performance.eventId === profile.strongestEventId,
  );
  const strongestEvent = strongest ? eventById(strongest.eventId) : null;

  const strongestLabel =
    profile.closelyMatched && profile.leadingEventIds.length > 1
      ? "Leading performances"
      : "Strongest performance";

  const strongestValue = strongest
    ? profile.closelyMatched && profile.leadingEventIds.length > 1
      ? `${strongest.points} pts`
      : `${strongest.points} pts`
    : "";

  const strongestDetail = strongest
    ? profile.closelyMatched && profile.leadingEventIds.length > 1
      ? profile.leadingEventIds
          .map((eventId) => {
            const row = profile.performances.find((performance) => performance.eventId === eventId)!;
            return `${eventById(eventId).label} · ${formatPerformanceTime(row.milliseconds)} · ${row.points}`;
          })
          .join(" · ")
      : `${strongestEvent?.label} · ${formatPerformanceTime(strongest.milliseconds)}`
    : "";

  return (
    <div className="run-lab-calculator__result run-lab-calculator__result--profile" aria-live="polite">
      <Metric label={strongestLabel} value={strongestValue} primary />
      {strongestDetail ? (
        <p className="run-lab-calculator__profile-detail">{strongestDetail}</p>
      ) : null}

      <div className="run-lab-calculator__profile-block">
        <p className="run-lab-calculator__profile-heading">Relative profile</p>
        <ProfileGauge position={profile.gaugePosition} label={profile.shapeLabel} />
      </div>

      <div className="run-lab-calculator__profile-block">
        <p className="run-lab-calculator__profile-heading">Your performances on the World Athletics scale</p>
        <ProfileBarChart
          performances={profile.chartPerformances}
          leadingEventIds={profile.leadingEventIds}
        />
      </div>

      <div className="run-lab-calculator__profile-block">
        <p className="run-lab-calculator__profile-heading">Interpretation</p>
        <p className="run-lab-calculator__profile-interpretation">{profile.interpretation}</p>
      </div>

      <p className="run-lab-calculator__result-note">
        {profileGuideNote} Tables: {profile.edition} ({sexLabel}).
      </p>
    </div>
  );
}
