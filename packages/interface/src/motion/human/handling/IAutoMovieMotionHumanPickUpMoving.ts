import type { IAutoMovieMotionHumanPickUp } from "./IAutoMovieMotionHumanPickUp";

/**
 * Parameters for taking a moving prop off its initial rigid socket. The
 * directly driven support translates uniformly and horizontally at a positive
 * speed up to 0.25 m/s with constant rotation. The moving pickup law checks
 * this path and refuses an unsupported interception.
 */
export interface IAutoMovieMotionHumanPickUpMoving
  extends IAutoMovieMotionHumanPickUp.IParams {
  /** Seconds from the action's time zero to grip closure, in (0, 2]. */
  closeAt: number;
}
