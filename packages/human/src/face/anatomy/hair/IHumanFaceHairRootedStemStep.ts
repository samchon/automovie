import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairRootSupport } from "./IHumanFaceHairRootSupport";

/**
 * One rooted-stem station's inputs to `stepHumanFaceHairRootedStem`.
 *
 * `points` are the stem's admitted stations, root first, with the current
 * station last. `hit` is the contact's sample at that station and `normal` its
 * outward skin normal (the root's own normal at the root). `initial` is the
 * root's emergence direction, used only by the first chord. Positions and
 * lengths are current head-frame metres. The collider readers and the budget
 * are the walk's.
 *
 * @evidence contracts/common.md#principled-implementation Supplies exactly the station state and one collider's readers the stem step decides with.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace the walk's captured locals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no waypoint, subject or tolerance.
 * @evidence contracts/common.md#meaningful-documentation States the order of points, the root special case, frames and ownership.
 * @evidence contracts/modeling.md#spatial-conventions Positions and lengths are head-frame metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The walk emits stations.
 * @evidence contracts/modeling.md#shared-boundaries Contact, ray index and root support read the one host collider.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedStemStep {
  /** Admitted stations, root first; the last is the current station. */
  points: readonly IAutoMovieVector3[];

  /** The root's emergence direction, taken by the first chord. */
  initial: IAutoMovieVector3;

  /** Unit outward skin normal at the current station. */
  normal: IAutoMovieVector3;

  /** Unit surface normal at the root. */
  rootNormal: IAutoMovieVector3;

  /** Contact sample at the current station. */
  hit: ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>;

  /** The lock's sampling step, in metres. */
  step: number;

  /** The lock's metric target length, in metres. */
  length: number;

  /** Metric travelled so far, in metres. */
  travelled: number;

  /** Contact of the walk. */
  contact: IHumanFaceHairContact;

  /** Ray index over the same collider. */
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;

  /** The root's original support and proximity reader. */
  rootBoundary: IHumanFaceHairRootSupport;

  /** The walk's shared lock budget. */
  budget: IAutoMovieMeshQueryBudget;
}
