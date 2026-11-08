/** Presentation geometry only. No application or financial state. */
export function viewportMetrics(height: number, offsetTop = 0) {
  return {
    height: Number.isFinite(height) && height > 0 ? height : 1,
    top: Number.isFinite(offsetTop) ? Math.max(0, offsetTop) : 0,
  };
}
