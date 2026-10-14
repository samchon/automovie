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
 * Positions and travel are current head-frame metres. With `originOnSkin`, the ray starts at a seated root and can skip an original-support hit only when both root and hit are within epsilon of that named triangle. Epsilon bounds unsigned proximity to the support, not travel length along the ray. Exterior mode skips no intersection. Every query spends the caller's budget, including a refusal.
 *
 * @evidence contracts/common.md#principled-implementation One immutable-ray request binds signed contact, ray index and original root support to the same current closed collider snapshot.
 * @evidence contracts/common.md#clear-and-simple-design Origin mode, metric bound and shared budget are explicit so the interval owner can distinguish a seated-root prefix from exterior travel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Root mode skips only original-support hits whose root and hit pass the unsigned-proximity checks; incidence alone excuses no hit, and exterior mode skips none.
 * @evidence contracts/common.md#meaningful-documentation The fields document current metre travel, owner-normalized direction, root mode, same-collider readers and query-budget effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This ray-input contract chooses no hit enumeration strategy; createHumanFaceHairExteriorInterval owns the budgeted ray and signed-query traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reader identity is supplied by the current host; this argument introduces no cache that could reuse an interval after collider changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The budget and host readers are caller-owned, and the argument itself owns no asynchronous ray task.
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
