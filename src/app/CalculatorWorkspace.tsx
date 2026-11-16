import { useEffect, useRef, useState } from "react";
import { workspaceCopy } from "../config/copy";
import { useShareState } from "../share/shareContext";
import type { ToolId } from "../tools/toolTypes";
import { CalculatorPanel } from "./CalculatorPanel";
import { useCalculatorTools, useEditableCopy } from "./editableCopyContext";
import { ToolSelector } from "./ToolSelector";

export function CalculatorWorkspace() {
  const tools = useCalculatorTools();
  const { disclaimer } = useEditableCopy();
  const incoming = useShareState();
  const [selectedId, setSelectedId] = useState<ToolId>(incoming?.tool ?? "predict");
  const selectedTool = tools.find((tool) => tool.id === selectedId) ?? tools[0];
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
      <p className="run-lab-calculator__disclaimer">{disclaimer}</p>
    </section>
  );
}

