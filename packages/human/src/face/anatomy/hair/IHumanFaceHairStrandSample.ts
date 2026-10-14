import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One interpolated strand before placement on its canonical stem.
 *
 * Points are head-frame metres along the interpolated strand, `length` is its metric target and `normal` the root surface normal it was interpolated with. Placement projects only the stations beyond the stem.
 *
 * @evidence contracts/common.md#principled-implementation Interpolated root-first stations, target length and root normal define the strand before canonical-stem placement.
 * @evidence contracts/common.md#clear-and-simple-design Interpolation output is distinct from admitted geometry, so placement can reject its remainder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The schema is an internal numerical curve sample rather than a named biological authoring input.
 * @evidence contracts/common.md#meaningful-documentation points and length use head metres and normal is the source root surface direction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Interpolation and remainder placement are owned by their respective functions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Canonical stem data is reused by placement instead of independently growing the root prefix.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interpolation caller owns point and normal storage; this type acquires no collider handles.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStrandSample {
  /** Interpolated stations, root first. */
  points: readonly IAutoMovieVector3[];

  /** Metric target length of the strand, in metres. */
  length: number;

  /** Root surface normal the strand was interpolated with. */
  normal: IAutoMovieVector3;
}
