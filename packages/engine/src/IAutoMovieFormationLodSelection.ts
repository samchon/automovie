import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 *
 * One automatic LOD decision with its combined selection metric.
 *
 * `lod` is an element of the input's tier array, not a copy, so comparing it by
 * identity against the input tiers is valid.
 *
 * @evidence contracts/common.md#principled-implementation Returns the chosen tier with the effective distance it was judged by, so a caller can log or measure the decision without repeating the screen-space scaling.
 * @evidence contracts/common.md#clear-and-simple-design Two fields only; the tier name a caller keeps for the next frame is read from `lod.tier` rather than duplicated beside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no override flag; when the deadband keeps the previous tier, `effectiveDistance` still reports the unadjusted metric that was compared.
 * @evidence contracts/common.md#meaningful-documentation States that the tier references the input array and how effective distance relates to the 24-pixel neutral size.
 * @evidenceExclude contracts/performance.md#cost-and-resources A two-field result of a selection over at most three tiers, with no algorithm of its own. One decision per chunk per frame; the viewer keeps only `lod.tier` from it for the next frame's hysteresis. Holds a reference to a tier the compiled formation already owns plus one number, so dropping the selection frees nothing else.
 * @author Samchon
 */
export interface IAutoMovieFormationLodSelection {
  /** Selected compiled tier, the same object as one element of the input `lod`. */
  lod: IAutoMovieCompiledFormationLod;

  /**
   * Camera distance in meters scaled by `24 / projectedPixels`: larger when a
   * member projects below 24 pixels, smaller when it projects above.
   */
  effectiveDistance: number;
}
