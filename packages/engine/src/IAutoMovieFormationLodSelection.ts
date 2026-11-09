import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * One automatic LOD decision with its combined selection metric.
 *
 * `lod` is an element of the input's tier array, not a copy, so comparing it by
 * identity against the input tiers is valid.
 *
 * @evidence contracts/development/design.md#principled-representation Returns the chosen tier by identity together with the effective distance it was chosen against, so a caller can compare tiers by reference and log the metric that decided them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields, the decision and its metric; the previous-tier bookkeeping stays with the caller, which passes it back as the next input.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tier is an element of the input array rather than a copy, so no consumer needs a lookup or equality workaround to find which tier won.
 * @evidence contracts/development/common.md#meaningful-documentation States that the tier is the same object as an input element, and the exact formula and direction of the effective distance including the one pixel floor.
 */
export interface IAutoMovieFormationLodSelection {
  /** Selected compiled tier, the same object as one element of the input `lod`. */
  lod: IAutoMovieCompiledFormationLod;

  /**
   * Camera distance in meters scaled by `24 / max(1, projectedPixels)`: larger
   * when a member projects below 24 pixels, smaller when it projects above.
   */
  effectiveDistance: number;
}
