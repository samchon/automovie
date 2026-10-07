import type { IAutoMovieMeshQueryBudget } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { humanFaceHairContact } from "./humanFaceHairContact";

/**
 * A pre-tie gather candidate that `transportHumanFaceHairGatherStep` advances.
 *
 * Positions, travel and offset are current head-frame metres; directions are
 * unit vectors and strength is dimensionless in [0, 1]. Only the shared
 * budget is mutated, by contact retraction and the closing skin query.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the requested direction, normal, derived free offset and strength the scalar transport relation reads.
 * @evidence contracts/common.md#clear-and-simple-design Eight named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no subject, triangle, waypoint or tolerance exception.
 * @evidence contracts/common.md#meaningful-documentation States units, ranges, mutation and the consumer.
 * @evidence contracts/modeling.md#spatial-conventions Positions, travel and offset are current head metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Strength is the existing admitted gather control; no new channel is defined.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator admits actual stations.
 * @evidence contracts/modeling.md#shared-boundaries The contact member is the same collider, floor and clearance the integrator uses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state and the existing admitted strength, not a personal control.
 * @author Samchon
 */
export interface IHumanFaceHairGatherTransportState {
  /** Current station, in head-frame metres. */
  point: IAutoMovieVector3;

  /** Requested unit travel direction from the gather blend. */
  direction: IAutoMovieVector3;

  /** Unit outward skin normal at the current station. */
  normal: IAutoMovieVector3;

  /** Non-negative travel along `direction`, in metres. */
  parameter: number;

  /** Gather strength in [0, 1]; zero keeps the ordinary path. */
  strength: number;

  /** Current free offset from the skin, at least clearance minus epsilon. */
  offset: number;

  /** Same-collider contact readers of this lock. */
  contact: ReturnType<typeof humanFaceHairContact>;

  /** Shared lock budget spent by retraction and the closing skin query. */
  budget: IAutoMovieMeshQueryBudget;
}
