import { workspaceCopy } from "../config/copy";
import { Tool02RacePace } from "../tools/Tool02RacePace";
import type { ToolDefinition } from "../tools/toolTypes";
import { InfoPopover } from "./InfoPopover";

type CalculatorPanelProps = {
  tool: ToolDefinition;
};

export function CalculatorPanel({ tool }: CalculatorPanelProps) {
  return (
    <section className="run-lab-calculator__panel">
      <h3>{tool.title}</h3>
      <p className="run-lab-calculator__panel-summary">{tool.description}</p>
      <InfoPopover>{tool.purpose}</InfoPopover>
      {tool.id === "pace" ? (
        <Tool02RacePace />
      ) : (
        <p className="run-lab-calculator__pending">{workspaceCopy.notCalculated}</p>
      )}
    </section>
  );
}
