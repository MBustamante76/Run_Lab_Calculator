type ProfileGaugeProps = {
  /** 0 = speed, 0.5 = middle, 1 = endurance. */
  position: number;
  label: string;
};

const CX = 120;
const CY = 110;
const R = 88;

function polar(angleDeg: number, radius = R) {
  const radians = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(radians),
    y: CY + radius * Math.sin(radians),
  };
}

function arcPath(startDeg: number, endDeg: number) {
  const start = polar(startDeg);
  const end = polar(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function ProfileGauge({ position, label }: ProfileGaugeProps) {
  const clamped = Math.min(1, Math.max(0, position));
  const needleAngle = 180 * clamped;
  const tip = polar(needleAngle, R - 10);
  const baseLeft = polar(needleAngle - 90, 6);
  const baseRight = polar(needleAngle + 90, 6);

  return (
    <div className="run-lab-calculator__profile-gauge">
      <svg
        viewBox="0 -8 240 148"
        role="img"
        aria-label={`Relative profile gauge: ${label}`}
        className="run-lab-calculator__profile-gauge-svg"
      >
        <path d={arcPath(0, 60)} className="run-lab-calculator__profile-gauge-arc run-lab-calculator__profile-gauge-arc--speed" />
        <path
          d={arcPath(60, 120)}
          className="run-lab-calculator__profile-gauge-arc run-lab-calculator__profile-gauge-arc--middle"
        />
        <path
          d={arcPath(120, 180)}
          className="run-lab-calculator__profile-gauge-arc run-lab-calculator__profile-gauge-arc--endurance"
        />
        <polygon
          points={`${tip.x},${tip.y} ${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y}`}
          className="run-lab-calculator__profile-gauge-needle"
        />
        <circle cx={CX} cy={CY} r={5} className="run-lab-calculator__profile-gauge-hub" />
        <text x="28" y="128" className="run-lab-calculator__profile-gauge-caption">
          Speed
        </text>
        <text x="120" y="9" textAnchor="middle" className="run-lab-calculator__profile-gauge-caption">
          Middle-distance
        </text>
        <text x="212" y="128" textAnchor="end" className="run-lab-calculator__profile-gauge-caption">
          Endurance
        </text>
      </svg>
      <p className="run-lab-calculator__profile-gauge-label">{label}</p>
    </div>
  );
}
