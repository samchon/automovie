import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanLimbView } from "./HumanLimbView";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { solveHumanLimbFit } from "./solveHumanLimbFit";

/**
 * The limb fit an ordered refit applies (`refitHumanPosture`), the paired
 * arms' own fits (`HumanLimbPair`) and a leg probe (`HumanLegChain`), solved
 * directly by `solveHumanLimbFit` with no memory of earlier fits. The result
 * shares the records the fit leaves unchanged with the input pose, which
 * every caller owns or treats as immutable. A refit passes the admission its
 * limbs share (`HumanLimbView.IAdmission`), so the whole pose is admitted
 * once for them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the direct solve, its callers, the shared admission and the shared-record result. Member facts: continued: Names current-target correction for the owned continuous curve.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to the one direct solver, which mirrors left limbs and solves in the root-position frame. Member facts: continued: Selects the continuous policy (current hinged correction), whose curve owner admits the physical result.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation per solver policy, the ordinary one here and the continuous one in `continued`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every request is solved from its own inputs; no stored answer, key or caller ownership flag. Member facts: continued: No changed goal or tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper work plus the solve. Member facts: continued: The same.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each request is solved afresh.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function applyHumanLimbFit(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  admission?: HumanLimbView.IAdmission): IAutoMovieSeededChainFit {
  return solveHumanLimbFit(body, pose, limb, goal, placed, rival, near, resolution, "ordinary", admission);
}

/**
 * The owned continuous curve's limb fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the one member and its solver policy.
 * @evidence contracts/development/design.md#principled-representation The producer's call path selects the solver policy; no ownership flag or stored answer is represented.
 * @evidence contracts/development/design.md#minimal-and-owned-surface continued serves the free-leg curve's refit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No arbitrary source registration or cached answer.
 */
export namespace applyHumanLimbFit {
  /** The owned continuous curve's fit: the direct solve under the current hinged correction. */
  export function continued(...args: Parameters<typeof applyHumanLimbFit>): ReturnType<typeof applyHumanLimbFit> {
    return solveHumanLimbFit(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], "continuous", args[8]);
  }
}
