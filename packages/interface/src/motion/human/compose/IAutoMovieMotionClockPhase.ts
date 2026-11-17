/**
 * A named phase duration in seconds. AutoMovieMotionClock.sequence accumulates these lengths into action instants; the value is not an elapsed timestamp.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A named phase duration in seconds. AutoMovieMotionClock.sequence accumulates these lengths into action instants; the value is not an elapsed timestamp.
 * @evidence contracts/development/design.md#principled-representation A law decides phase lengths (a reach's travel time, a hold), so a phase carries a length and the clock derives the instants by summing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMotionClock.sequence and repeat share phase lengths with action-family planners; elapsed instants remain a separate contract because their origin differs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts AutoMovieMotionClock.sequence rejects negative phase lengths and delegates summed-clock admission to of. Zero-length phases deliberately retain coincident instants.
 */
export interface IAutoMovieMotionClockPhase {
  /** The instant that opens the phase. */
  name: string;

  /** The phase's length, seconds; not negative. */
  seconds: number;
}
