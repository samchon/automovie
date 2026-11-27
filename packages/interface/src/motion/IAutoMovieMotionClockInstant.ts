/**
 * A named instant measured in seconds since an action starts, distinct from a
 * phase duration. AutoMovieMotionClock.of checks names and placement within its
 * duration.
 */
export interface IAutoMovieMotionClockInstant {
  /** Name, unique within the clock; never `start` or `end`. */
  name: string;

  /** Seconds since the action's start, in [0, duration]. */
  seconds: number;
}
