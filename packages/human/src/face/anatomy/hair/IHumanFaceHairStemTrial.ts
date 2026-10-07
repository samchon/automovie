import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One trial chord at the station where a rooted stem refused.
 *
 * The exterior interval along `direction` was certified up to `bound` metres
 * (`bounded` when a surface ended it before the station's nominal chord). For a
 * clipped trial, `reached` is the certified interior point the progress rule
 * tested, with its clearance, nearest triangle and outward normal.
 *
 * @evidence contracts/common.md#principled-implementation Carries exactly the interval and progress facts the stem decided on.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports state; it changes no geometry.
 * @evidence contracts/common.md#meaningful-documentation States the meaning of bound, bounded and the reached point.
 * @evidence contracts/modeling.md#spatial-conventions Positions, travel and clearance are head-frame metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused stem emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The interval owns the boundary proof.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemTrial {
  /** Unit trial direction. */
  direction: IAutoMovieVector3;

  /** Certified travel along the direction, in metres. */
  bound: number;

  /** Whether a surface ended the interval before the nominal chord. */
  bounded: boolean;

  /** The certified interior point the progress rule tested. */
  reached: IAutoMovieVector3;

  /** Signed free distance of `reached`. */
  reachedClearance: number;

  /** Original collider triangle nearest `reached`. */
  reachedTriangle: number;

  /** Unit outward normal of the skin nearest `reached`. */
  blocking: IAutoMovieVector3;
}
