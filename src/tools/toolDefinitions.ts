import { isToolEnabled } from "../config/toolSupport";
import type { ToolDefinition } from "./toolTypes";

const catalogue = [
  {
    id: "predict",
    number: "01",
    title: "Predict my times at other distances",
    description: "Use a current PB to estimate equivalent race performances.",
    purpose:
      "This tool estimates an equivalent performance at another distance from one or two of your own performances.",
  },
  {
    id: "pace",
    number: "02",
    title: "Calculate my race pace",
    description: "Turn a distance and finishing time into pace and speed.",
    purpose:
      "This tool turns a race distance and finishing time into pace and speed.",
  },
  {
    id: "finish",
    number: "03",
    title: "Calculate my finishing time",
    description: "Enter a distance and running pace to find your finish time.",
    purpose:
      "This tool turns a race distance and running pace into a finishing time. This assumes the entered average pace is maintained for the full distance.",
  },
  {
    id: "target",
    number: "04",
    title: "Plan my target PB",
    description: "See the pace and splits needed to reach your next goal.",
    purpose: "This tool is planned for a later milestone.",
  },
  {
    id: "splits",
    number: "05",
    title: "Build my race splits",
    description: "Create clear checkpoint times for your chosen race.",
    purpose: "This tool is planned for a later milestone.",
  },
  {
    id: "profile",
    number: "06",
    title: "Discover my performance profile",
    description: "See where your running strengths currently lie.",
    purpose: "This tool is planned for a later milestone.",
  },
] as const satisfies readonly Omit<ToolDefinition, "enabled">[];

export const tools: readonly ToolDefinition[] = catalogue.map((tool) => ({
  ...tool,
  enabled: isToolEnabled(tool.id),
}));

export function findTool(id: ToolDefinition["id"]): ToolDefinition {
  const tool = tools.find((candidate) => candidate.id === id);
  if (!tool) {
    throw new Error(`Unknown tool: ${id}`);
  }
  return tool;
}
