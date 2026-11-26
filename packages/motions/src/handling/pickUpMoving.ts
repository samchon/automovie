import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPickUpMoving,
} from "@automovie/interface";

import { pickUp } from "./pickUp";
import { pickUpIntercept } from "./pickUpIntercept";

/**
 * Intercept a mounted prop on a translating support at an authored time. The
 * hand matches incoming velocity at closure, brakes over the load phase, and
 * lifts with the ordinary pickup's stance, grip and cancellation rules.
 * Register this law in the performance's `laws` and the typed authoring chain.
 */
export const pickUpMoving: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPickUpMoving> =
  {
    name: "pickUpMoving",
    family: pickUp.name,
    interrupts: pickUp.interrupts,
    plan: planPickUpMoving,
  };

/**
 * Intercept a mounted prop on a translating support at an authored time. The
 * hand matches incoming velocity at closure, brakes over the load phase, and
 * lifts with the ordinary pickup's stance, grip and cancellation rules.
 * Register this law in the performance's `laws` and the typed authoring chain.
 */
function planPickUpMoving(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUpMoving>,
): IAutoMovieMotionHumanActionPlan {
  const { closeAt } = context.params;
  return pickUp.planGrasp(context, pickUpIntercept(context, closeAt));
}
