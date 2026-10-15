type MetricProps = {
  label: string;
  value: string;
};

export function Metric({ label, value }: MetricProps) {
  return (
    <div className="run-lab-calculator__metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
