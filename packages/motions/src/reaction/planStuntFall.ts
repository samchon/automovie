import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStuntFall,
} from "@automovie/interface";

import { stuntFallHigh } from "./stuntFallHigh";
import { stuntFallStairs } from "./stuntFallStairs";

/**
 * Plan a staged stunt fall by its kind: down a staircase or from a ledge.
 *
 * @param context The action's context.
 * @returns The fall's plan.
 * @throws {HumanRefusal} From the selected fall when the scene cannot stage it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the dispatch and the refusal owner.
 * @evidence contracts/development/implementation.md#principled-implementation Each fall is planned by its own module over the named props.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One dispatch on the discriminant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No variant is special-cased beyond its kind.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant dispatch.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Plans once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the selected plan.
 */
export function planStuntFall(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStuntFall.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanStuntFall.IParams = context.params;
  return p.kind === "stairs"
    ? stuntFallStairs(context, p)
    : stuntFallHigh(context, p);
}
