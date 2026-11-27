import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanThrowObject,
  IAutoMovieMotionHumanThrowObjectLaunch,
} from "@automovie/interface";

/**
 * The launch a throw's plan carries.
 *
 * @param plan A plan.
 * @returns Its launch, or undefined when it is not a throw's.
 */
export function readThrowObjectLaunch(
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanThrowObjectLaunch.ILaunch | undefined {
  return (plan as Partial<IAutoMovieMotionHumanThrowObject.IPlan>).launch;
}
