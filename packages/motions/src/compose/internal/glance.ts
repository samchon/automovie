import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { lookPrimitive } from "./lookPrimitive";

/**
 * A glance: the gaze goes to a target and comes back, its weight rising over
 * one window and falling over another on the clock's envelope, and the head is
 * written from the first instant to the last. Re-exported as
 * `AutoMovieMotionHumanGaze.glance`.
 *
 * @param body The body.
 * @param clock The action's clock.
 * @param rise The instants the gaze leaves and arrives at.
 * @param fall The instants the gaze starts returning and is back at.
 * @param target What is looked at.
 * @param recruit Which segments may join; the head too by default.
 * @returns The primitive.
 */
export function glance(
  body: IAutoMovieMotionHumanBody,
  clock: IAutoMovieMotionClock,
  rise: readonly [string, string],
  fall: readonly [string, string],
  target: IAutoMovieMotionHumanGaze.Frame,
  recruit: IAutoMovieMotionHumanGaze.HeadRecruit = "head",
): IAutoMovieMotionHumanPrimitive {
  return lookPrimitive({
    body,
    recruit,
    from: clock.at(rise[0]),
    to: clock.at(fall[1]),
    target,
    weight: (seconds: number): number => clock.envelope(rise, fall, seconds),
  });
}
