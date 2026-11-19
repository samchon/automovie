import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPickUpMoving,
} from "@automovie/interface";

import { HumanPerformanceParams } from "../perform/HumanPerformanceParams";
import { pickUp } from "./pickUp";
import { pickUpIntercept } from "./pickUpIntercept";

/**
 * Intercept a mounted prop on a translating support at an authored time.
 * The hand matches incoming velocity at closure, brakes over the load phase,
 * and lifts with the ordinary pickup's stance, grip and cancellation rules.
 * Register this law in the performance's `laws` and the typed authoring chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States registration, the interception and the inherited pickup phases.
 */
export const pickUpMoving: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPickUpMoving> =
  {
    name: "pickUpMoving",
    family: pickUp.name,
    interrupts: pickUp.interrupts,
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUpMoving>,
    ): IAutoMovieMotionHumanActionPlan => {
      const { closeAt, ...pickup } = context.params;
      HumanPerformanceParams.check(pickUp.name, pickup);
      return pickUp.planGrasp(context, pickUpIntercept(context, closeAt));
    },
  };
