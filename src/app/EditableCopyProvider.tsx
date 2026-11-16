import { useMemo, type ReactNode } from "react";
import { mergeEditableCopy, readHostCopy } from "../config/editableCopy";
import { EditableCopyContext } from "./editableCopyContext";

export function EditableCopyProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => mergeEditableCopy(readHostCopy()), []);
  return <EditableCopyContext.Provider value={value}>{children}</EditableCopyContext.Provider>;
}
