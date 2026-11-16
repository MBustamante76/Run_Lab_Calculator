import { useMemo, type ReactNode } from "react";
import { ShareContext } from "./shareContext";
import { parseShareSearch } from "./shareState";

export function ShareProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => parseShareSearch(window.location.search), []);
  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
}
