import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * One automatic LOD decision with its combined selection metric.
 *
 * `lod` is an element of the input's tier array, not a copy, so comparing it by
 * identity against the input tiers is valid.
 *
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
