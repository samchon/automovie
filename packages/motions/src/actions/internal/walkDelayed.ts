import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/*
 * A stepping plan begun after a wait in its own first posture, as a follower
 * stands until it is time to set off.
 *
 * Its events and contact windows keep their seconds after the wait; a window
 * open from the plan's start stays open from the wait's start, so the feet that
 * stand at the start stand through the wait; and a `depart` event marks the
 * wait's end.
 * Parameter plan: The plan.
 * Parameter wait: Seconds waited before it begins; positive.
 * Returns: The plan with the wait before it.
 */
export function walkDelayed(
  plan: IAutoMovieMotionHumanActionPlan,
  wait: number,
): IAutoMovieMotionHumanActionPlan {
  const duration: number = wait + plan.duration;
  const share: (was: number) => number = (was: number): number =>
    was <= 1e-12 ? 0 : (wait + was * plan.duration) / duration;
  return {
    ...plan,
    duration,
    events: [
      { name: "depart", share: wait / duration },
      ...plan.events.map(
        (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
          ...e,
          share: share(e.share),
        }),
      ),
    ],
    contacts: plan.contacts.map(
      (
        c: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => ({
        ...c,
        from: share(c.from),
        to: share(c.to),
      }),
    ),
    ...(plan.contact === undefined ? {} : { contact: wait + plan.contact }),
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      plan.posture(
        Math.max(0, seconds - wait),
        channels,
        resolution,
        projection,
      ),
  };
}
