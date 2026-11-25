import type { IAutoMovieMotionClock } from "@automovie/interface";

/**
 * How far a touch's arm is from its entry angles to its goal at a second: the
 * clock's envelope, rising from `start` to `ready` and falling from `relax` to
 * `end`.
 *
 * @param clock The touch's clock.
 * @param seconds Seconds since the action's start.
 * @returns A share in [0, 1].
 */
export function touchEnvelope(
  clock: IAutoMovieMotionClock,
  seconds: number,
): number {
  return clock.envelope(["start", "ready"], ["relax", "end"], seconds);
}
