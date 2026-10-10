import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairRootSupport } from "./IHumanFaceHairRootSupport";

/**
 * One root's launch inputs to `launchHumanFaceHairCurve`.
 *
 * Root, length, clearance and epsilon are current head-frame metres; the exit
 * direction is normalized by the owner. The budget continues into the metric
 * walk that follows.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLaunch {
  /** Seated root position. */
  root: IAutoMovieVector3;

  /** Emergence direction leaving the skin. */
  exitDirection: IAutoMovieVector3;

  /** The lock's metric length, bounding the launch travel, in metres. */
  length: number;

  /** Contact sampler, clearance and allowance of the same collider. */
  contact: Pick<IHumanFaceHairContact, "sample" | "clearance" | "epsilon">;

  /** Ray index over the same collider. */
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;

  /** The root's original support and proximity reader. */
  rootBoundary: IHumanFaceHairRootSupport;

  /** Caller-owned lock budget, also consumed by the subsequent metric walk. */
  budget: IAutoMovieMeshQueryBudget;
}
