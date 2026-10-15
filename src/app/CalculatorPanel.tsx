import { workspaceCopy } from "../config/copy";
import type { ToolDefinition } from "../tools/toolTypes";
import { InfoPopover } from "./InfoPopover";

type CalculatorPanelProps = {
  tool: ToolDefinition;
};

export function CalculatorPanel({ tool }: CalculatorPanelProps) {
  return (
    <section className="run-lab-calculator__panel" aria-live="polite">
      <h3>{tool.title}</h3>
      <p className="run-lab-calculator__panel-summary">{tool.description}</p>
      <InfoPopover>{tool.purpose}</InfoPopover>
      <p className="run-lab-calculator__pending">{workspaceCopy.notCalculated}</p>
    </section>
  );
}
