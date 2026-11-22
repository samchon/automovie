import type { IAutoMovieMotionClock } from "@automovie/interface";

/**
 * How far a touch's arm is from its entry angles to its goal at a second:
 * the clock's envelope, rising from `start` to `ready` and falling from
 * `relax` to `end`.
 *
 * @param clock The touch's clock.
 * @param seconds Seconds since the action's start.
 * @returns A share in [0, 1].
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two ramps and the range.
 * @evidence contracts/development/implementation.md#principled-implementation The arm's carry and the goal's stand-off read one envelope, so the hand arrives on the region as the carry completes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to the clock.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The instants are the clock's own names.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionClock.IClock.envelope`.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function touchEnvelope(
  clock: IAutoMovieMotionClock,
  seconds: number,
): number {
  return clock.envelope(["start", "ready"], ["relax", "end"], seconds);
}
