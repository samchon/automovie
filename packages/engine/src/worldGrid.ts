import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/**
 * Copy a compact instance design with an authored rectangular-grid layout.
 *
 * @evidence contracts/common.md#principled-implementation Independent structuredClone calls preserve base design fields and grid rows, columns and spacing by value; instanceSlot and compiled materialization own the actual row-major positions.
 * @evidence contracts/common.md#clear-and-simple-design This assembly seam uses the existing layout union instead of duplicating grid arithmetic or materializing count-sized arrays; current repository helper calls are tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Grid dimensions, count and spacing are copied without admission or repair, and structuredClone failures propagate rather than becoming a default layout.
 * @evidence contracts/common.md#meaningful-documentation Documents copied ownership and the distinction between compact grid design and computed instance placement.
 * @evidence contracts/performance.md#efficient-algorithms Cost follows the supplied base/layout graph sizes and allocates their clones; it is independent of instance count until a downstream owner places members.
 * @evidence contracts/performance.md#reuse-equivalent-work Each graph is copied once per call without a persistent design cache, so changed nested input values are read afresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh cloned base and layout; no member buffer, renderer, task or source watcher is retained.
 */
export const worldGrid: (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: {
    kind: "grid";
    rows: number;
    columns: number;
    spacing: { x: number; z: number };
  },
) => IAutoMovieInstanceSetDesign = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "grid" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
