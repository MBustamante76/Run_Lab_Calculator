import { useEffect, useRef } from "react";

/** Run calculate once when a shared link opened this tool. */
export function useAutoCalculate(active: boolean, calculate: () => void) {
  const ran = useRef(false);

  useEffect(() => {
    if (!active || ran.current) {
      return;
    }
    ran.current = true;
    calculate();
  }, [active, calculate]);
}
