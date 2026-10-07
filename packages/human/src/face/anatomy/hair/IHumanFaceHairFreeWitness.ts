import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A point whose free distance to the closed collider was actually measured.
 *
 * Distance to a closed set is 1-Lipschitz, so `humanFaceHairFreeDistanceBound`
 * can prove a nearby candidate free from this one sample without a new query.
 * The contact projector and the ribbon mesher each keep their own latest
 * witness; it is copied and owned by that keeper.
 *
 * @evidence contracts/common.md#principled-implementation Keeps exactly the measured point and distance the Lipschitz bound needs.
 * @evidence contracts/common.md#clear-and-simple-design Two named members replace a repeated anonymous pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only a measured sample becomes a witness; nothing is extrapolated.
 * @evidence contracts/common.md#meaningful-documentation States the bound it serves, its keepers and ownership.
 * @evidence contracts/modeling.md#spatial-conventions The point and distance are current head-frame metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The distance is measured against the one host collider.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairFreeWitness {
  /** The sampled point. */
  point: IAutoMovieVector3;

  /** Its measured signed free distance, in metres. */
  free: number;
}
