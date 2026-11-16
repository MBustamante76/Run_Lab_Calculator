import { useEditableCopy } from "./editableCopyContext";
import type { ToolId } from "../tools/toolTypes";

export function FormLead({ toolId }: { toolId: ToolId }) {
  const lead = useEditableCopy().tools[toolId].formLead;
  if (lead.trim() === "") {
    return null;
  }
  return <p className="run-lab-calculator__form-lead">{lead}</p>;
}
