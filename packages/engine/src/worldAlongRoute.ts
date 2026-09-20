import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/**
 * Build one deterministic route-following instance placement.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's selected prototype and route-following placement rule as one compact instance-set design.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Returns the explicit route, spacing, offset, and variation inputs without resolving them through hidden defaults.
 */
export const worldAlongRoute = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<
    IAutoMovieInstanceSetDesign["layout"],
    { kind: "along-route" }
  >,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
