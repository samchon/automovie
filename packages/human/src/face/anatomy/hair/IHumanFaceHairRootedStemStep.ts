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
 * `points` are the stem's admitted stations, root first, with the current station last. `hit` is the contact's sample at that station and `normal` its outward skin normal (the root's own normal at the root). `initial` is the root's emergence direction, used only by the first chord. Positions and lengths are current head-frame metres. The collider readers and the budget are the walk's.
 *
 * @evidence contracts/common.md#principled-implementation Admitted stations, root normal, current contact and nominal remaining metric define one rooted station's bounded trials.
 * @evidence contracts/common.md#clear-and-simple-design The request keeps root-support identity, ray index and budget with the walk that owns them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original root support is not widened and clipped trial travel does not replace the station's nominal construction turn.
 * @evidence contracts/common.md#meaningful-documentation All distances use head-frame metres; initial applies to the first chord and travelled records spent length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The rooted step and exterior owners execute trials; this request declares no traversal algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same compiled readers and budget are reused across trials instead of compiling per station.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The walk owns stations and query contexts; this type borrows them without retaining a second history.
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
