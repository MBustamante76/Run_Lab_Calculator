import { createContext, useContext, useMemo } from "react";
import { defaultEditableCopy, type EditableCopy } from "../config/editableCopy";
import { findTool } from "../tools/toolDefinitions";
import { toolIds, type ToolDefinition, type ToolId } from "../tools/toolTypes";

export const EditableCopyContext = createContext<EditableCopy>(defaultEditableCopy);

export function useEditableCopy(): EditableCopy {
  return useContext(EditableCopyContext);
}

export function useCalculatorTools(): readonly ToolDefinition[] {
  const copy = useEditableCopy();
  return useMemo(
    () =>
      toolIds.map((id: ToolId) => {
        const tool = findTool(id);
        const text = copy.tools[id];
        return {
          ...tool,
          title: text.title,
          description: text.description,
          purpose: text.purpose,
        };
      }),
    [copy],
  );
}
