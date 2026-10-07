import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A point carried to a requested free offset from the same hair collider,
 * returned by the `retract` reader of `humanFaceHairContact`.
 *
 * The point lies at the requested offset along the outward normal of its
 * closest skin hit, and a second query confirms that offset within epsilon
 * and at least the free clearance. Concave or ambiguous geometry that never
 * settles refuses instead of returning.
 *
 * @evidence contracts/common.md#principled-implementation Returns the confirmed offset point together with the actual outward normal that produced it.
 * @evidence contracts/common.md#clear-and-simple-design Two named vectors replace an anonymous return type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only a re-measured offset is returned; non-convergence refuses.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the confirmation and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions The point is current head-frame metres; the normal is a unit direction.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator admits actual stations.
 * @evidence contracts/modeling.md#shared-boundaries Measured against the same collider and clearance that admit every hair station.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 * @author Samchon
 */
export interface IHumanFaceHairRetraction {
  /** Retracted position at the requested offset, in current head-frame metres. */
  point: IAutoMovieVector3;

  /** Unit outward skin normal at the hit that placed `point`. */
  normal: IAutoMovieVector3;
}
