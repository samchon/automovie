import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * A stepping plan begun after a wait in its own first posture, as a
 * follower stands until it is time to set off.
 *
 * Its events and contact windows keep their seconds after the wait; a
 * window open from the plan's start stays open from the wait's start, so
 * the feet that stand at the start stand through the wait; and a `depart`
 * event marks the wait's end.
 *
 * @param plan The plan.
 * @param wait Seconds waited before it begins; positive.
 * @returns The plan with the wait before it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, what moves, the event added and the units.
 * @evidence contracts/development/implementation.md#principled-implementation A shift of the plan's clock: the pose stays a pure function of the film second, and every share is mapped by the same shift, so events, contacts and poses agree.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One share map applied to the events, the windows and the decisive instant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A share at zero, within 1e-12 of it against rounding, is read as "from the start", which a stepping plan uses only for the feet it starts standing on.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the events and windows, once per plan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the plan for as long as the returned plan is held.
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
      (c: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanContactWindow => ({
        ...c,
        from: share(c.from),
        to: share(c.to),
      }),
    ),
    ...(plan.contact === undefined ? {} : { contact: wait + plan.contact }),
    posture: (seconds: number, channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1], resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2], projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture =>
      plan.posture(Math.max(0, seconds - wait), channels, resolution, projection),
  };
}
