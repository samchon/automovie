import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairRootSupport } from "./IHumanFaceHairRootSupport";

/**
 * One current skin ray `createHumanFaceHairExteriorInterval` certifies.
 *
 * Positions and travel are current head-frame metres. With `originOnSkin` the
 * ray starts at a seated root and may touch only its original support within
 * an epsilon-sized prefix; otherwise no intersection is skipped. Every query
 * spends the caller's budget, including a refusal.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the ray, its travel bound, root mode and the one collider's readers the interval proof needs.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no tolerance beyond the contact allowance and no skipped-hit exception.
 * @evidence contracts/common.md#meaningful-documentation States both modes, units and budget spending.
 * @evidence contracts/modeling.md#spatial-conventions Root and travel are head-frame metres; the direction is normalized by the owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries Root mode admits only the original support of the same host skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer-derived rays, not personal controls.
 *
 * @author Samchon
 */
export interface IHumanFaceHairExteriorRay {
  /** Ray origin. */
  root: IAutoMovieVector3;

  /** Ray direction; the owner normalizes it. */
  direction: IAutoMovieVector3;

  /** Largest travel along the ray, in metres; must exceed the contact epsilon. */
  maximum: number;

  /** True when the ray starts at a seated root on the skin. */
  originOnSkin: boolean;

  /** Contact sampler and allowance of the same collider. */
  contact: Pick<IHumanFaceHairContact, "sample" | "epsilon">;

  /** Ray index over the same collider. */
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;

  /** The root's original support and proximity reader. */
  rootBoundary: IHumanFaceHairRootSupport;

  /** Shared lock budget spent by every query. */
  budget: IAutoMovieMeshQueryBudget;
}
