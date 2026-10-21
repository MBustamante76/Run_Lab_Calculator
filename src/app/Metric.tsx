type MetricProps = {
  label: string;
  value: string;
  primary?: boolean;
};

export function Metric({ label, value, primary = false }: MetricProps) {
  return (
    <div className={primary ? "run-lab-calculator__metric run-lab-calculator__metric--primary" : "run-lab-calculator__metric"}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
