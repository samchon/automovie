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
