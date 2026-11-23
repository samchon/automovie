import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";

/**
 * One key of a dancing foot's course (`DanceFootwork.foot`): the foot
 * arrives at `place` at `at`, dwells there until `leave`, and travels to
 * the next key between, lifted by that next key's `clearance`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each field and the dwell rule.
 * @evidence contracts/development/design.md#principled-representation One record per arrival of a foot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Time, place, bearing, lift and an optional turning dwell.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds are the action's own; places are world placements.
 */
export interface IAutoMovieMotionHumanDanceFootKey {
  /** Action seconds the foot arrives. */
  at: number;

  /** Action seconds it leaves for the next key, at or after `at`. */
  leave: number;

  /** Where it arrives. */
  place: IAutoMovieMotionHumanFoot.IPlacement;

  /** Whether it bears weight while it dwells. */
  bears: boolean;

  /** How high the travel into this key lifts the foot, metres; 0 slides it along the floor. */
  clearance: number;

  /**
   * The placement while it dwells, for a foot that turns as it bears (a
   * pirouette's supporting foot); `place` throughout when absent.
   *
   * @param seconds Action seconds within the dwell.
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a key supplies it, the argument's timebase and range, and the default when absent.
   */
  hold?(seconds: number): IAutoMovieMotionHumanFoot.IPlacement;
}
