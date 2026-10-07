import type { IAutoMovieMeshQueryBudget } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { humanFaceHairContact } from "./humanFaceHairContact";

/**
 * The current rooted station that `steerHumanFaceHairRootedStep` previews.
 *
 * Points and the step are current head-frame metres and the two directions are
 * unit vectors. Nothing here is mutated except the shared budget, which the
 * one trial query spends.
 *
 * @evidence contracts/common.md#principled-implementation Supplies exactly the station, previous direction, outward normal, step, collider and budget the directional proposal needs.
 * @evidence contracts/common.md#clear-and-simple-design Six named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no saved host, subject or waypoint.
 * @evidence contracts/common.md#meaningful-documentation States units, mutation and the consumer.
 * @evidence contracts/modeling.md#spatial-conventions Points and step are current head metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator admits actual stations.
 * @evidence contracts/modeling.md#shared-boundaries The contact member is the same collider and clearance the integrator uses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 * @author Samchon
 */
export interface IHumanFaceHairRootedSteering {
  /** Current station, in head-frame metres. */
  point: IAutoMovieVector3;

  /** Previous unit travel direction that bounds the turn. */
  before: IAutoMovieVector3;

  /** Unit outward skin normal at the current station. */
  normal: IAutoMovieVector3;

  /** Trial travel in metres; must exceed the contact epsilon. */
  step: number;

  /** Same-collider contact readers of this lock. */
  contact: ReturnType<typeof humanFaceHairContact>;

  /** Shared lock budget; the trial query spends one unit. */
  budget: IAutoMovieMeshQueryBudget;
}
