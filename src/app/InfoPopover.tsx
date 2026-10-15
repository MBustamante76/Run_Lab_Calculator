import { useId, useState } from "react";
import { workspaceCopy } from "../config/copy";

type InfoPopoverProps = {
  children: string;
};

export function InfoPopover({ children }: InfoPopoverProps) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  return (
    <div className="run-lab-calculator__explainer">
      <button
        type="button"
        className="run-lab-calculator__purpose"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {workspaceCopy.purposeLabel}
      </button>
      {open ? (
        <p id={panelId} className="run-lab-calculator__purpose-text">
          {children}
        </p>
      ) : null}
    </div>
  );
}
