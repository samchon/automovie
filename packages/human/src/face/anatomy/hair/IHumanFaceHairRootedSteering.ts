import type { IAutoMovieMeshQueryBudget } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { humanFaceHairContact } from "./humanFaceHairContact";

/**
 * The current rooted station that `steerHumanFaceHairRootedStep` previews.
 *
 * Points and the step are current head-frame metres and the two directions are unit vectors. Nothing here is mutated except the shared budget, which the one trial query spends.
 *
 * @evidence contracts/common.md#principled-implementation A current station, preceding direction and unit skin normal define one budgeted trial before rooted interval admission.
 * @evidence contracts/common.md#clear-and-simple-design steerHumanFaceHairRootedStep owns finite travel admission and the same-collider contact preview.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The step must exceed contact epsilon; a trial direction alone does not establish a clear exterior interval.
 * @evidence contracts/common.md#meaningful-documentation points and step are head-frame metres and the shared budget is the sole intentionally mutable field.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One trial query and turn limiting belong to the steering producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Contact readers are borrowed from the existing lock context; no equivalent reader is built here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The walk owns its contact snapshot and budget; caller vectors remain borrowed.
 *
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
