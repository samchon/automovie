/**
 * A dance's beat clock (`prepareDanceBeats`): beat `k`, from 1, falls at
 * `at(k)` action seconds, one `period` apart after the `lead`.
 */
export interface IAutoMovieMotionHumanDanceBeats {
  /** Seconds between beats. */
  period: number;

  /** Seconds from the action's start to the first beat. */
  lead: number;

  /** How many beats. */
  count: number;

  /**
   * The seconds of a beat.
   *
   * @param k The beat, from 1; a fraction falls between beats.
   * @returns Action seconds.
   */
  at(k: number): number;
}
