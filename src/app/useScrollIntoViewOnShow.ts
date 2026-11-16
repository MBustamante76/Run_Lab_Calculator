import { type RefObject, useEffect } from "react";

/**
 * Smooth-scroll to `ref` when `trigger` increases (e.g. each successful Calculate).
 * Pass 0 initially; bump the counter after a valid result is produced.
 */
export function useScrollIntoViewOnShow(trigger: number, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (trigger <= 0) {
      return;
    }
    // Two frames so remounted result panels (e.g. Tool 06) have layout before scrolling.
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        ref.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [trigger, ref]);
}
