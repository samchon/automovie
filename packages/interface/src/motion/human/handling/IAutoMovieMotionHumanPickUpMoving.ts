import type { IAutoMovieMotionHumanPickUp } from "./IAutoMovieMotionHumanPickUp";

/**
 * Parameters for taking a moving prop off its initial rigid socket.
 * The directly driven support translates uniformly and horizontally at a
 * positive speed up to 0.25 m/s with constant rotation. The moving pickup
 * law checks this path and refuses an unsupported interception.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the supported support path, units, bounds, and admission owner.
 * @evidence contracts/development/design.md#principled-representation A scheduled interception adds just the closure instant to canonical pickup parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the moving pickup law requires a closure instant.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inherits the ordinary pickup's prop, grasp, side and lift parameters.
 */
export interface IAutoMovieMotionHumanPickUpMoving
  extends IAutoMovieMotionHumanPickUp.IParams {
  /** Seconds from the action's time zero to grip closure, in (0, 2]. */
  closeAt: number;
}
