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
      "Omar has a 1500m PB of 5:10. His next goal is to break 5 minutes. But what pace does he need to run?\n\nEnter your target distance and finishing time to discover the pace and splits needed to reach your goal.\n\nThink of it like planning a journey. Rather than just knowing where you want to finish, you can see the checkpoints along the way.\n\nIt's a pacing plan, not a guarantee. The hard work still happens on the track.",
  },
  {
    id: "splits",
    number: "05",
    title: "Build my race splits",
    description: "Create clear checkpoint times for your chosen race.",
    purpose:
      "Javier wants to run 800m in 2:20. Should he run both laps at exactly the same speed?\n\nChoose your race distance, target time and pacing strategy to build a set of race splits.\n\nThink of it like having a race map. Each checkpoint tells you where you should be, helping you judge your effort and stay on track.\n\nYour splits are a guide. Real races rarely go exactly to plan.",
  },
  {
    id: "profile",
    number: "06",
    title: "Discover my performance profile",
    description: "Compare your performances and discover where your running strengths currently lie.",
    purpose:
      "Layla runs 800m, 1500m and 3000m. But which is actually her strongest event?\n\nEnter your personal bests to compare your performances using World Athletics points.\n\nYou might be good at 800m, better at 1500m and strongest at 3000m. But how can you tell when the distances are so different? That's where the points come in.\n\nDiscover your strengths, spot opportunities and see where you might improve next.\n\nIt's a snapshot of where you are today, not a limit on what you can achieve tomorrow.",
  },
  {
    id: "ageGrade",
    number: "07",
    title: "Age-grade my performance",
    description: "See how good a race is when age and sex are taken into account.",
    purpose:
      "Pat is 45 and has just run 5K in 22 minutes. But how good is that performance for someone of Pat's age?\n\nEnter your age, sex, race distance and finishing time to discover your age-grade percentage.\n\nThink of it like giving everyone a fairer starting point. A 60-year-old and a 25-year-old might run different times, but both could produce equally impressive performances for their age.\n\nYou'll also see an equivalent time showing how your performance compares with an open-age runner.\n\nIt's a way to celebrate what you can do at your age, not just how fast you run.",
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
