import { workspaceCopy } from "../config/copy";
import { Tool01Predict } from "../tools/Tool01Predict";
import { Tool02RacePace } from "../tools/Tool02RacePace";
import { Tool03FinishingTime } from "../tools/Tool03FinishingTime";
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
      {tool.id === "predict" ? <Tool01Predict /> : null}
      {tool.id === "pace" ? <Tool02RacePace /> : null}
      {tool.id === "finish" ? <Tool03FinishingTime /> : null}
      {tool.id === "predict" || tool.id === "pace" || tool.id === "finish" ? null : (
        <p className="run-lab-calculator__pending">{workspaceCopy.notCalculated}</p>
      )}
    </section>
  );
}
