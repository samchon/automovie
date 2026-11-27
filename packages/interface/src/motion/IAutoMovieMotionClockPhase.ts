/**
 * A named phase duration in seconds. motionClock.sequence accumulates
 * these lengths into action instants; the value is not an elapsed timestamp.
 */
export interface IAutoMovieMotionClockPhase {
  /** The instant that opens the phase. */
  name: string;

  /** The phase's length, seconds; not negative. */
  seconds: number;
}
