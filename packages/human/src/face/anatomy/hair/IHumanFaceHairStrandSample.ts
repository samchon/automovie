import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One interpolated strand before placement on its canonical stem.
 *
 * Points are head-frame metres along the interpolated strand, `length` is its
 * metric target and `normal` the root surface normal it was interpolated
 * with. Placement projects only the stations beyond the stem.
 *
 * @evidence contracts/common.md#principled-implementation Carries the interpolated stations and target length placement checks against.
 * @evidence contracts/common.md#clear-and-simple-design Three named members replace an anonymous property type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Placement never resamples or stretches these stations.
 * @evidence contracts/common.md#meaningful-documentation States units and what placement reads.
 * @evidence contracts/modeling.md#spatial-conventions Points and length are head-frame metres; the normal is a unit direction.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Placement decides which stations are emitted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
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
