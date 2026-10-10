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
