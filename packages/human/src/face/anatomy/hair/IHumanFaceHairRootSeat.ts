import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * One sampled root carried to the current face without changing its source reference.
 *
 * @evidence contracts/common.md#principled-implementation The generic root subtype retains sampler identity while current position and normal describe its evaluated seat.
 * @evidence contracts/common.md#clear-and-simple-design Reference and evaluated vectors travel in one seating result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reference is retained rather than replaced by a new personal point.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes original root from current metre position and unit direction.
 * @evidence contracts/modeling.md#spatial-conventions Evaluated position is current head-frame metres and normal is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Strand identity remains with the root producer.
 * @evidenceExclude contracts/modeling.md#parameter-channels This is derived output, not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Seating evaluates references without defining a primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The seat evaluator owns attachment calculation.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes assembled geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical seating establishes no measured follicle or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range No biological range is admitted.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The seat is derived rather than personally authored.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSeat<T extends IHumanFaceHairRootReference> {
  /** Original root identity and sampling data, retained as the caller's subtype. */
  root: T;

  /** Current barycentric root position, head-frame metres. */
  seated: IAutoMovieVector3;

  /** Current outward unit direction from the original face winding. */
  normal: IAutoMovieVector3;
}
