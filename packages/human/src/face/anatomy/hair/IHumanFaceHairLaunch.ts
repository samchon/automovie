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
 * Root, length, clearance and epsilon are current head-frame metres; the launch owner normalizes the exit direction and spends the supplied remaining budget. A caller continuing a walk must retain that accounting. This standalone numerical launch currently has no repository execution caller; the curved-stem integrator uses the shared exterior-interval owner directly.
 *
 * @evidence contracts/common.md#principled-implementation A seated root and desired emergence ray share current closed contact, ray index and original support so launch cannot excuse another surface's hit.
 * @evidence contracts/common.md#clear-and-simple-design Length bounds launch travel while the existing lock budget is passed through to subsequent walking rather than creating a second launch quota.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The support reader certifies the actual root prefix; this context does not inject a fixture launch point or replenish failed-query work.
 * @evidence contracts/common.md#meaningful-documentation The prose states metre quantities, owner-normalized direction, budget continuation obligations and the current lack of an execution caller for this standalone launch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The launch context chooses no root-finding method; launchHumanFaceHairCurve owns distance advances and representable-point search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This input type coordinates no requests; any caller continuing after launch must use the same supplied collider and remaining budget rather than interpreting another root's result as equivalent.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned readers and accounting survive launch as needed by the walk; this input acquires no resource requiring a launch-specific release.
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

  /** Caller-owned remaining lock budget; a subsequent walk must continue this same object. */
  budget: IAutoMovieMeshQueryBudget;
}
