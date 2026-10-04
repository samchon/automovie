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
 * @evidence contracts/common.md#principled-implementation Supplies the seated root, emergence direction, metric bound and the one collider's readers the launch needs.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no tolerance or iteration limit.
 * @evidence contracts/common.md#meaningful-documentation States units and budget continuation.
 * @evidence contracts/modeling.md#spatial-conventions Positions and lengths are head-frame metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The launcher returns one station.
 * @evidence contracts/modeling.md#shared-boundaries The root support and ray index read the one host skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Emergence supplies the direction.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived inputs, not a personal control.
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
  raycaster: Pick<ReturnType<typeof createAutoMovieMeshRayCaster>, "nearestHit">;

  /** The root's original support and proximity reader. */
  rootBoundary: IHumanFaceHairRootSupport;

  /** Caller-owned lock budget, also consumed by the subsequent metric walk. */
  budget: IAutoMovieMeshQueryBudget;
}
