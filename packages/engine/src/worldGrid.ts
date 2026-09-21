import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/**
 * Build one deterministic rectangular instance placement.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's selected prototype, bounds, variation, and rectangular layout as one compact instance-set design.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Returns the caller's grid parameters as plain cloned output without inventing or expanding content.
 */
export const worldGrid = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "grid" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
