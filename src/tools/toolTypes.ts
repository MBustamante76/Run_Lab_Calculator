export const toolIds = [
  "predict",
  "pace",
  "finish",
  "target",
  "splits",
  "profile",
] as const;

export type ToolId = (typeof toolIds)[number];

export type ToolDefinition = {
  id: ToolId;
  number: string;
  title: string;
  description: string;
  purpose: string;
  enabled: boolean;
};
