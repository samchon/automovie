import type { IAutoMovieMotionEvent } from "./IAutoMovieMotionEvent";

/** An intent's timing. */
export interface IAutoMovieIntentTiming {
  /**
   * Full uncut duration in seconds; AutoMovieSchedulePlace rejects negative or
   * nonfinite values.
   */
  duration: number;

  /**
   * Seconds from the start to its contact or decisive instant, within the
   * duration.
   */
  contact?: number;

  /**
   * Named instants as shares of the full duration; omitted means none. Callers
   * supply valid shares: only a share selected as a cut is range-checked by the
   * scheduler.
   */
  events?: readonly IAutoMovieMotionEvent[];
}
