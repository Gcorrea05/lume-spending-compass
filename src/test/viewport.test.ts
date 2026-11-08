import { describe, expect, it } from "vitest";
import { viewportMetrics } from "@/lib/viewport";

describe("visual viewport geometry", () => {
  it("keeps a regular desktop viewport", () => {
    expect(viewportMetrics(1080)).toEqual({ height: 1080, top: 0 });
  });
  it("supports a keyboard-reduced viewport and offset", () => {
    expect(viewportMetrics(310, 46)).toEqual({ height: 310, top: 46 });
  });
  it("guards transient invalid measurements", () => {
    expect(viewportMetrics(Number.NaN, Number.NaN)).toEqual({ height: 1, top: 0 });
    expect(viewportMetrics(-1, -9)).toEqual({ height: 1, top: 0 });
  });
});
