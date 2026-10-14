import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * One automatic LOD decision with its combined selection metric.
 *
 * `lod` is an element of the input's tier array, not a copy, so comparing it by
 * identity against the input tiers is valid.
 *
 * @evidence contracts/common.md#principled-implementation Returns the chosen tier by identity together with the effective distance it was chosen against, so a caller can compare tiers by reference and log the metric that decided them.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the decision and its metric; the previous-tier bookkeeping stays with the caller, which passes it back as the next input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tier is an element of the input array rather than a copy, so no consumer needs a lookup or equality workaround to find which tier won.
 * @evidence contracts/common.md#meaningful-documentation States that the tier is the same object as an input element, and the exact formula and direction of the effective distance including the one pixel floor.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Result record; producing it costs the selector's scans over the tier list, answered on `selectFormationLod`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh decision per call; the only reuse, hysteresis toward the previous tier, is driven by the caller passing the previous tier back.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds one reference into the caller's tier array and one number; it extends no lifetime beyond that array's.
 * @author Samchon
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
