import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";

/**
 * One rooted-stem station's look-ahead request to `anticipateHumanFaceHairRootedStem`.
 *
 * Positions and lengths are current head-frame metres; directions are unit vectors. `heading` is the turn-limited direction the station would take, `before` the previous chord's direction and `normal` the station's outward skin normal. The ray index and contact read the same closed collider, and every look-ahead ray spends the shared lock budget.
 *
 * @evidence contracts/common.md#principled-implementation A station, requested heading and same-collider contact or ray readers define a budgeted preview of continuation.
 * @evidence contracts/common.md#clear-and-simple-design The request keeps geometry, turn input and shared query budget together for anticipateHumanFaceHairRootedStem.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preview does not admit a real chord or substitute another collider; exterior interval checks still own actual progress.
 * @evidence contracts/common.md#meaningful-documentation Positions and step use head metres, directions are unit vectors and every preview cast spends budget.remaining.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Curved continuation and deferred-plan ray loops are owned by anticipateHumanFaceHairRootedStem.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request borrows the walk's already compiled ray and contact readers instead of rebuilding them.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The walk owns its readers and mutable budget; this erased request transfers no geometry handle ownership.
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
