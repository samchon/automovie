/**
 * The durations in seconds of the six movement phases between a phrase's seven synchronization instants. AutoMovieMotionClock.phrase admits and sums these lengths.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The durations in seconds of the six movement phases between a phrase's seven synchronization instants. AutoMovieMotionClock.phrase admits and sums these lengths.
 * @evidence contracts/development/design.md#principled-representation The phases of a gesture (Kendon 1980: preparation, hold, stroke, hold, retraction), with the stroke split at its decisive instant as BML 1.0 splits it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMotionHumanTiming produces phrase lengths and AutoMovieMotionClock.phrase consumes them; the six fields correspond to the seven named synchronization instants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts AutoMovieMotionClock.phrase treats omitted wait/follow/hold as zero, rejects negative lengths and delegates positive-total admission to of.
 */
export interface IAutoMovieMotionPhraseDurations {
  /** From `start` to `ready`: the part leaves rest for where its stroke starts. */
  prepare: number;

  /** From `ready` to `strokeStart`: the part waits there; 0 when absent. */
  wait?: number;

  /** From `strokeStart` to `stroke`: the stroke up to its decisive instant. */
  attack: number;

  /** From `stroke` to `strokeEnd`: the stroke after it; 0 when absent. */
  follow?: number;

  /** From `strokeEnd` to `relax`: the part stays where the stroke left it; 0 when absent. */
  hold?: number;

  /** From `relax` to `end`: the part returns to rest. */
  retract: number;
}
