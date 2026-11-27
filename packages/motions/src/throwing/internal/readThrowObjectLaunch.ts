import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanThrowObject,
  IAutoMovieMotionHumanThrowObjectLaunch,
} from "@automovie/interface";

/*
 * The launch a throw's plan carries.
 * Parameter plan: A plan.
 * Returns: Its launch, or undefined when it is not a throw's.
 */
export function readThrowObjectLaunch(
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanThrowObjectLaunch.ILaunch | undefined {
  return (plan as Partial<IAutoMovieMotionHumanThrowObject.IPlan>).launch;
}
