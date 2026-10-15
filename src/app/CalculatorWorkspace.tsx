import { useState } from "react";
import { workspaceCopy } from "../config/copy";
import { findTool, tools } from "../tools/toolDefinitions";
import type { ToolId } from "../tools/toolTypes";
import { CalculatorPanel } from "./CalculatorPanel";
import { ToolSelector } from "./ToolSelector";

export function CalculatorWorkspace() {
  const [selectedId, setSelectedId] = useState<ToolId>("predict");
  const selectedTool = findTool(selectedId);

  return (
    <section className="run-lab-calculator__workspace" aria-label="Calculator">
      <div className="run-lab-calculator__work-head">
        <p className="run-lab-calculator__step">{workspaceCopy.step}</p>
        <h2>{workspaceCopy.heading}</h2>
      </div>
      <div className="run-lab-calculator__work-grid">
        <ToolSelector tools={tools} selectedId={selectedId} onSelect={setSelectedId} />
        <CalculatorPanel tool={selectedTool} />
      </div>
    </section>
  );
}
