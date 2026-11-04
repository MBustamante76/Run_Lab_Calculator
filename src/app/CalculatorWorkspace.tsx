import { useEffect, useRef, useState } from "react";
import { calculatorDisclaimer, workspaceCopy } from "../config/copy";
import { findTool, tools } from "../tools/toolDefinitions";
import type { ToolId } from "../tools/toolTypes";
import { CalculatorPanel } from "./CalculatorPanel";
import { ToolSelector } from "./ToolSelector";

export function CalculatorWorkspace() {
  const [selectedId, setSelectedId] = useState<ToolId>("predict");
  const selectedTool = findTool(selectedId);
  const panelRef = useRef<HTMLElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [selectedId]);

  return (
    <section className="run-lab-calculator__workspace" aria-label="Calculator">
      <div className="run-lab-calculator__work-head">
        <p className="run-lab-calculator__step">{workspaceCopy.step}</p>
        <h2>{workspaceCopy.heading}</h2>
      </div>
      <div className="run-lab-calculator__work-grid">
        <ToolSelector tools={tools} selectedId={selectedId} onSelect={setSelectedId} />
        <CalculatorPanel tool={selectedTool} panelRef={panelRef} />
      </div>
      <p className="run-lab-calculator__disclaimer">{calculatorDisclaimer}</p>
    </section>
  );
}

