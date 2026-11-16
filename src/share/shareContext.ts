import { createContext, useContext } from "react";
import type { ShareState } from "./shareState";

export const ShareContext = createContext<ShareState | null>(null);

export function useShareState(): ShareState | null {
  return useContext(ShareContext);
}
