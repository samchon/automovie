import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";

/**
 * One key of a dancing foot's course (`DanceFootwork.foot`): the foot arrives
 * at `place` at `at`, dwells there until `leave`, and travels to the next key
 * between, lifted by that next key's `clearance`.
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

  /**
   * How high the travel into this key lifts the foot, metres; 0 slides it along
   * the floor.
   */
  clearance: number;

  /**
   * The placement while it dwells, for a foot that turns as it bears (a
   * pirouette's supporting foot); `place` throughout when absent.
   *
   * @param seconds Action seconds within the dwell.
   * @returns The placement.
   */
  hold?(seconds: number): IAutoMovieMotionHumanFoot.IPlacement;
}
