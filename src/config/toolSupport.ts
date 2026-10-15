import { featureFlags } from "./featureFlags";
import type { ToolId } from "../tools/toolTypes";

const futureMilestoneTools = new Set<ToolId>(["target", "splits", "profile"]);

export function isToolEnabled(id: ToolId): boolean {
  if (!featureFlags.tools04to06 && futureMilestoneTools.has(id)) {
    return false;
  }

  return true;
}
