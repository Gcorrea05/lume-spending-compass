import { useEffect } from "react";
import { viewportMetrics } from "@/lib/viewport";

/** Keeps overlays inside the visible viewport without blocking browser zoom. */
export function ViewportSafety() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { height, top } = viewportMetrics(viewport?.height ?? window.innerHeight, viewport?.offsetTop ?? 0);
        root.style.setProperty("--lume-viewport-height", `${height}px`);
        root.style.setProperty("--lume-viewport-top", `${top}px`);
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && focused.matches("input, textarea, select") && focused.closest("[role='dialog']")) {
          const rect = focused.getBoundingClientRect();
          if (rect.bottom > top + height - 16 || rect.top < top + 16) {
            focused.scrollIntoView({ block: "nearest", behavior: "auto" });
          }
        }
      });
    };
    update();
    window.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    document.addEventListener("focusin", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      root.style.removeProperty("--lume-viewport-height");
      root.style.removeProperty("--lume-viewport-top");
    };
  }, []);
  return null;
}
