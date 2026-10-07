import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One rooted-stem station's escape request to `aimHumanFaceHairRootedStem`.
 *
 * `normal` is the actual outward normal of the skin at the station and
 * `blocking` the actual outward normal of the surface a trial chord would
 * reach first; both are unit head-frame directions read from the same closed
 * collider. `before` is the previous chord's unit direction and `step` the
 * station's nominal chord in metres, whose construction turn bounds the aim
 * for every trial at that station.
 *
 * @evidence contracts/common.md#principled-implementation Supplies exactly the two surface normals the maximum-margin direction is built from and the fixed per-station turn budget.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no subject, waypoint or tolerance.
 * @evidence contracts/common.md#meaningful-documentation States each member's source, frame and why the step is fixed per station.
 * @evidence contracts/modeling.md#spatial-conventions Directions are unit head-frame vectors and the step is metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
 * @evidence contracts/modeling.md#shared-boundaries Both normals are read from the one host collider the stem must clear.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedAim {
  /** Unit direction of the previous stem chord. */
  before: IAutoMovieVector3;

  /** Unit outward skin normal at the current station. */
  normal: IAutoMovieVector3;

  /** Unit outward normal of the surface a trial chord would reach first. */
  blocking: IAutoMovieVector3;

  /** The station's nominal chord in metres; its construction turn bounds the aim. */
  step: number;
}
