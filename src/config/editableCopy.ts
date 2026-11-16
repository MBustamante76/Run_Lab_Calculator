import { calculatorDisclaimer, introCopy } from "./copy";
import { tools } from "../tools/toolDefinitions";
import { toolIds, type ToolId } from "../tools/toolTypes";

export type IntroCopy = {
  eyebrow: string;
  headlineLead: string;
  headlineAccent: string;
  summary: string;
  sideTitle: string;
  sideBody: string;
};

export type ToolCopy = {
  title: string;
  description: string;
  purpose: string;
  formLead: string;
};

export type EditableCopy = {
  intro: IntroCopy;
  disclaimer: string;
  tools: Record<ToolId, ToolCopy>;
};

const formLeads: Record<ToolId, string> = {
  predict: "Enter a PB, optionally add another PB, then choose the target distance.",
  pace: "Enter a race distance and finishing time to see your average pace, speed and splits.",
  finish: "Enter a race distance and pace to calculate the finishing time.",
  target: "Enter the distance and target PB time to see the pace and even splits you need.",
  splits:
    "Enter your race distance and goal finishing time to build checkpoint times. Choose even pace or a 2% negative split, and how often to mark the race.",
  profile:
    "Enter 2–6 race performances to compare them on the World Athletics scale and see whether your results currently lean towards speed, middle-distance or endurance.",
  ageGrade:
    "Enter sex, age, distance and race time to see your age-grade percentage on the 2025 road standards.",
};

function toolCopy(): Record<ToolId, ToolCopy> {
  const copy = {} as Record<ToolId, ToolCopy>;
  for (const tool of tools) {
    copy[tool.id] = {
      title: tool.title,
      description: tool.description,
      purpose: tool.purpose,
      formLead: formLeads[tool.id],
    };
  }
  return copy;
}

export const defaultEditableCopy: EditableCopy = {
  intro: {
    eyebrow: introCopy.eyebrow,
    headlineLead: introCopy.headlineLead,
    headlineAccent: introCopy.headlineAccent,
    summary: introCopy.summary,
    sideTitle: introCopy.sideTitle,
    sideBody: introCopy.sideBody,
  },
  disclaimer: calculatorDisclaimer,
  tools: toolCopy(),
};

export const introFields = [
  "eyebrow",
  "headlineLead",
  "headlineAccent",
  "summary",
  "sideTitle",
  "sideBody",
] as const satisfies readonly (keyof IntroCopy)[];

export const toolCopyFields = ["title", "description", "purpose", "formLead"] as const satisfies readonly (keyof ToolCopy)[];

declare global {
  interface Window {
    runLabCalculatorCopy?: unknown;
  }
}

export function readHostCopy(): unknown {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.runLabCalculatorCopy;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Use a WordPress override only when it is a non-empty string. Blank fields keep the built-in wording. */
export function pickCopyString(override: unknown, fallback: string): string {
  if (typeof override !== "string" || override.trim() === "") {
    return fallback;
  }
  return override;
}

export function mergeEditableCopy(override: unknown): EditableCopy {
  const source = isRecord(override) ? override : {};
  const introOverride = isRecord(source.intro) ? source.intro : {};
  const toolsOverride = isRecord(source.tools) ? source.tools : {};

  const intro = { ...defaultEditableCopy.intro };
  for (const field of introFields) {
    intro[field] = pickCopyString(introOverride[field], intro[field]);
  }

  const mergedTools = {} as Record<ToolId, ToolCopy>;
  for (const id of toolIds) {
    const fallback = defaultEditableCopy.tools[id];
    const toolOverride = isRecord(toolsOverride[id]) ? toolsOverride[id] : {};
    mergedTools[id] = {
      title: pickCopyString(toolOverride.title, fallback.title),
      description: pickCopyString(toolOverride.description, fallback.description),
      purpose: pickCopyString(toolOverride.purpose, fallback.purpose),
      formLead: pickCopyString(toolOverride.formLead, fallback.formLead),
    };
  }

  return {
    intro,
    disclaimer: pickCopyString(source.disclaimer, defaultEditableCopy.disclaimer),
    tools: mergedTools,
  };
}
