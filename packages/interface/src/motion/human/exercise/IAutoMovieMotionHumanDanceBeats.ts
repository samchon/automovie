/**
 * A dance's beat clock (`prepareDanceBeats`): beat `k`, from 1, falls at
 * `at(k)` action seconds, one `period` apart after the `lead`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each field is and the beat rule.
 * @evidence contracts/development/design.md#principled-representation One record of the shared beat rule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The period, the lead, the count and the reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds are the action's own.
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
