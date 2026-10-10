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
