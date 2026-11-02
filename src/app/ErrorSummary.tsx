import { useEffect, useRef } from "react";
import type { ValidationError } from "../calculation/types";

type ErrorSummaryProps = {
  errors: readonly ValidationError[];
};

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length === 0) {
      return;
    }
    const node = alertRef.current;
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div ref={alertRef} role="alert" className="run-lab-calculator__errors" tabIndex={-1}>
      <strong>Check the following</strong>
      <ul>
        {errors.map((error) => (
          <li key={`${error.fieldId}-${error.code}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}
