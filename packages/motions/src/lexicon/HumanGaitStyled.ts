import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanGait,
  IAutoMovieMotionHumanWalkGait,
} from "@automovie/interface";

import { walk } from "../gait/internal/walk";

/**
 * A walk in a gait of its own, under a name: the walk's cuts and yields,
 * planned by its stepping plan.
 */
export function HumanGaitStyled<P extends IAutoMovieMotionHumanGait.IParams>(
  name: string,
  gait: (
    context: IAutoMovieMotionHumanActionContext<P>,
  ) => IAutoMovieMotionHumanWalkGait,
): IAutoMovieMotionHumanActionLaw<P> {
  return {
    name,
    family: walk.name,
    interrupts: walk.interrupts,
    yields: walk.yields,
    plan: (
      context: IAutoMovieMotionHumanActionContext<P>,
    ): IAutoMovieMotionHumanActionPlan => walk.locomote(context, gait(context)),
  };
}
