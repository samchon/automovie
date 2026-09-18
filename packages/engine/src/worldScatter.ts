import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/**
 * Build one deterministic disk-scatter instance placement.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's selected prototype, variation, and disk-scatter rule as one compact instance-set design.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Returns the caller's scatter extent, count, seed, and spacing inputs without silently choosing population content.
 */
export const worldScatter = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "scatter" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
