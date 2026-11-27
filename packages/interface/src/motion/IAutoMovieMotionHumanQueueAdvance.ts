import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One release of a stationary, straight service queue. */
export interface IAutoMovieMotionHumanQueueAdvance {
  /**
   * The track, event and optional zero-based occurrence of the absolute film
   * cue that releases the head.
   */
  on: { of: string; event: string; index?: number };

  /**
   * A floor mark ahead of the head at which that performer finishes walking, in
   * world metres.
   */
  exit: IAutoMovieVector3;

  /**
   * Seconds each follower waits after the walk immediately ahead ends. Finite
   * and nonnegative, default 0.
   */
  wait?: number;
}
