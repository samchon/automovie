import type {
  IAutoMovieIntentTiming,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
} from "@automovie/interface";

/*
 * The timing the schedule reads of a placed or trial action
 * (`HumanPerformancePlace.place`): the part of the plan left after the share it
 * enters at, its contact and events on that part.
 * Parameter plan: The action's plan.
 * Parameter share: The share of the plan the action enters at.
 * Returns: The timing.
 */
export function HumanPerformancePlaceTiming(
  plan: Pick<
    IAutoMovieMotionHumanActionPlan,
    "duration" | "contact" | "events"
  >,
  share: number,
): IAutoMovieIntentTiming {
  const active: number = (1 - share) * plan.duration;
  return {
    duration: active,
    ...(plan.contact === undefined || plan.contact < share * plan.duration
      ? {}
      : { contact: plan.contact - share * plan.duration }),
    events: plan.events
      .filter((e: IAutoMovieMotionEvent): boolean => e.share >= share)
      .map(
        (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
          name: e.name,
          share: active === 0 ? 0 : (e.share - share) / (1 - share),
        }),
      ),
  };
}
