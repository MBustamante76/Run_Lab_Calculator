import type { ValidationError } from "../calculation/types";

type ErrorSummaryProps = {
  errors: readonly ValidationError[];
};

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div role="alert" className="run-lab-calculator__errors">
      <strong>Check the following</strong>
      <ul>
        {errors.map((error) => (
          <li key={`${error.fieldId}-${error.code}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}
