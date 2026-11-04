import { type Ref } from "react";
import { Tool01Predict } from "../tools/Tool01Predict";
import { Tool02RacePace } from "../tools/Tool02RacePace";
import { Tool03FinishingTime } from "../tools/Tool03FinishingTime";
import { Tool04TargetPb } from "../tools/Tool04TargetPb";
import { Tool05RaceSplits } from "../tools/Tool05RaceSplits";
import { Tool06PerformanceProfile } from "../tools/Tool06PerformanceProfile";
import { Tool07AgeGrade } from "../tools/Tool07AgeGrade";
import type { ToolDefinition } from "../tools/toolTypes";
import { InfoPopover } from "./InfoPopover";

type CalculatorPanelProps = {
  tool: ToolDefinition;
  panelRef?: Ref<HTMLElement>;
};

export function CalculatorPanel({ tool, panelRef }: CalculatorPanelProps) {
  return (
    <section ref={panelRef} className="run-lab-calculator__panel" tabIndex={-1}>
      <h3>{tool.title}</h3>
      <p className="run-lab-calculator__panel-summary">{tool.description}</p>
      <InfoPopover>{tool.purpose}</InfoPopover>
      {tool.id === "predict" ? <Tool01Predict /> : null}
      {tool.id === "pace" ? <Tool02RacePace /> : null}
      {tool.id === "finish" ? <Tool03FinishingTime /> : null}
      {tool.id === "target" ? <Tool04TargetPb /> : null}
      {tool.id === "splits" ? <Tool05RaceSplits /> : null}
      {tool.id === "profile" ? <Tool06PerformanceProfile /> : null}
      {tool.id === "ageGrade" ? <Tool07AgeGrade /> : null}
    </section>
  );
}
