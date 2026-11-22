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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the beat's base, that a fraction falls between beats, and the result's timebase.
   * @evidence contracts/development/implementation.md#principled-implementation prepareDanceBeats implements it as `lead + (k - 1) period`, or, locked with `exact`, as the track's own k-th instant; groupDance shifts a shared reader by a constant offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The reader carries the one beat rule, so every dance law reads its beats from one clock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An exact read past the locked instants falls back to the same grid rather than a guessed time.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each read is constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One reader per prepared clock serves every beat read of the action.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains at most `beats` locked instants, for as long as the action's plan holds it.
   */
  at(k: number): number;
}
