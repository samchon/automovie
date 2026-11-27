import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStuntFall,
} from "@automovie/interface";

import { stuntFallHigh } from "./stuntFallHigh";
import { stuntFallStairs } from "./stuntFallStairs";

/*
 * Plan a staged stunt fall by its kind: down a staircase or from a ledge.
 * Parameter context: The action's context.
 * Returns: The fall's plan.
 * From the selected fall when the scene cannot stage it.
 */
export function planStuntFall(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStuntFall.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanStuntFall.IParams = context.params;
  return p.kind === "stairs"
    ? stuntFallStairs(context, p)
    : stuntFallHigh(context, p);
}
