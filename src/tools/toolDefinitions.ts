import { isToolEnabled } from "../config/toolSupport";
import type { ToolDefinition } from "./toolTypes";

const catalogue = [
  {
    id: "predict",
    number: "01",
    title: "Predict my times at other distances",
    description: "Use a current PB to estimate equivalent race performances.",
    purpose:
      "Imagine Sarah has a 1500m PB of 5:30. What might she run for 3000m?\n\nShe can enter one PB for a prediction, or add a second PB, such as her 5000m time, to make the estimate more personal.\n\nThink of it like joining two dots on a graph rather than guessing from one.\n\nIt's a useful guide, not a guarantee.",
  },

  {
    id: "pace",
    number: "02",
    title: "Calculate my race pace",
    description: "Turn a distance and finishing time into pace and speed.",
    purpose:
      "James has just run 1500m in 5:30. But how fast was he actually running?\n\nEnter a distance and finishing time to discover your average pace, speed and split times.\n\nIt's like breaking a race into smaller, easier-to-understand pieces.\n\nRemember, these are averages. Your pace may have varied throughout the race.",
  },
  {
    id: "finish",
    number: "03",
    title: "Calculate my finishing time",
    description: "Enter a distance and running pace to find your finish time.",
    purpose:
      "Sophie wants to run 3000m at 4 minutes per kilometre. What finishing time would that give her?\n\nEnter your distance and target pace to find out. For Sophie, that's 12 minutes.\n\nIt's like planning a journey. Know the distance and speed, and you can calculate the time.\n\nThe result assumes a steady average pace. It's a calculation, not a prediction of your fitness.",
  },

  {
    id: "target",
    number: "04",
    title: "Plan my target PB",
    description: "See the pace and splits needed to reach your next goal.",
    purpose:
      "Maya wants to run 1500m in 5:00. What pace does that take, and what should each 400m feel like?\n\nEnter a target distance and goal time to see the required pace, speed and even splits.\n\nIt's like turning a dream PB into a practical race plan.\n\nThese are even-pace averages. Race day may vary.",
  },
  {
    id: "splits",
    number: "05",
    title: "Build my race splits",
    description: "Create clear checkpoint times for your chosen race.",
    purpose:
      "Alex is racing 5000m and wants to know what the clock should say at each kilometre for a 20:00 finish.\n\nEnter the race distance and goal time, choose even pace or a 2% negative split, and pick how often to mark the race.\n\nIt's like a simple race roadmap from start to finish.\n\nReal races often vary slightly from lap to lap.",
  },
  {
    id: "profile",
    number: "06",
    title: "Discover my performance profile",
    description: "See where your running strengths currently lie.",
    purpose:
      "Chris has a 800m PB of 2:10 and a 5000m PB of 18:30. Which is the stronger performance?\n\nEnter one to four PBs and choose men or women scoring tables. World Athletics outdoor points put different distances on one comparable scale.\n\nIt's a guide to relative strengths, not a ranking of your potential.\n\nPoints follow the published outdoor tables for the selected sex.",
  },
  {
    id: "ageGrade",
    number: "07",
    title: "Age-grade my performance",
    description: "See how good a race is when age and sex are taken into account.",
    purpose:
      "Pat is 45 and has just run 5K in 22:00. How does that compare once age is factored in?\n\nEnter sex, age, distance and time to get an age-grade percentage and an open-equivalent time.\n\nIt's a fair way to compare performances across age groups.\n\nScores use the 2025 USATF MLDR / WMA road standards.",
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
