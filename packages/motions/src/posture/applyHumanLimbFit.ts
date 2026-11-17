import type { IAutoMovieSeededChainFit, IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { solveHumanLimbFit } from "./solveHumanLimbFit";

/**
 * The limb fit an ordered refit applies (`refitHumanPosture`), solved
 * directly by `solveHumanLimbFit` with no memory of earlier fits. The result
 * shares the records the fit leaves unchanged with the input pose, which
 * every refit owns or treats as immutable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the direct solve and the shared-record result. Member facts: continued: Names current-target correction for the owned continuous curve. constructed: Names the base-free assembly's refit.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to the one direct solver, which mirrors left limbs and solves in the root-position frame. Member facts: continued: Selects the continuous policy (current hinged correction), whose curve owner admits the physical result. constructed: The ordinary policy, the same as this entry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation per refit route; the routes differ only in their solver policy. Member facts: continued: One delegation with the continuous policy. constructed: One delegation with the ordinary policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every request is solved from its own inputs; no stored answer, key or caller ownership flag. Member facts: continued: No changed goal or tolerance. constructed: No changed goal or tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper work plus the solve. Member facts: continued: The same. constructed: The same.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each request is solved afresh.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function applyHumanLimbFit(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
  goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
  return solveHumanLimbFit(body, pose, limb, goal, placed, rival, near, resolution);
}

/**
 * The refit routes of the base-free assembly and the owned continuous curve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both routes and their solver policies.
 * @evidence contracts/development/design.md#principled-representation The producer's call path selects the solver policy; no ownership flag or stored answer is represented.
 * @evidence contracts/development/design.md#minimal-and-owned-surface constructed serves the base-free refit's limb and paired-arm paths; continued serves the free-leg curve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No arbitrary source registration or cached answer.
 */
export namespace applyHumanLimbFit {
  /** The base-free assembly's fit: the ordinary direct solve. */
  export function constructed(...args: Parameters<typeof applyHumanLimbFit>): ReturnType<typeof applyHumanLimbFit> {
    return solveHumanLimbFit(...args);
  }

  /** The owned continuous curve's fit: the direct solve under the current hinged correction. */
  export function continued(...args: Parameters<typeof applyHumanLimbFit>): ReturnType<typeof applyHumanLimbFit> {
    return solveHumanLimbFit(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], "continuous");
  }
}
