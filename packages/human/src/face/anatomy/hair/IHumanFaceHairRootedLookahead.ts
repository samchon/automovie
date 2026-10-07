import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";

/**
 * One rooted-stem station's look-ahead request to
 * `anticipateHumanFaceHairRootedStem`.
 *
 * Positions and lengths are current head-frame metres; directions are unit
 * vectors. `heading` is the turn-limited direction the station would take,
 * `before` the previous chord's direction and `normal` the station's outward
 * skin normal. The ray index and contact read the same closed collider, and
 * every look-ahead ray spends the shared lock budget.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the heading, the turn reference, the station's skin and the one collider's readers the look-ahead needs.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no waypoint, subject or tolerance.
 * @evidence contracts/common.md#meaningful-documentation States frames, units, the shared collider and budget spending.
 * @evidence contracts/modeling.md#spatial-conventions Positions and lengths are head-frame metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
 * @evidence contracts/modeling.md#shared-boundaries The ray and the contact read the one host collider the stem must clear.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedLookahead {
  /** Current stem station. */
  point: IAutoMovieVector3;

  /** Turn-limited direction the station would take without look-ahead. */
  heading: IAutoMovieVector3;

  /** Unit direction of the previous stem chord. */
  before: IAutoMovieVector3;

  /** Unit outward skin normal at the station. */
  normal: IAutoMovieVector3;

  /** The station's nominal chord in metres; its construction turn bounds the result. */
  step: number;

  /** Ray index over the same closed collider as the contact. */
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;

  /** Contact sampler and outward reader of the same collider. */
  contact: Pick<IHumanFaceHairContact, "sample" | "outward">;

  /** Shared lock budget; the look-ahead ray spends one unit. */
  budget: IAutoMovieMeshQueryBudget;
}
