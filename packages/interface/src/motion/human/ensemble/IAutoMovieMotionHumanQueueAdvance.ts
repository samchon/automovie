import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * One release of a stationary, straight service queue.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the cue, clearance mark and per-follower wait in their authoring units; humanQueueAdvance admits the queue geometry.
 * @evidence contracts/development/design.md#principled-representation One head release and one fixed clearance mark determine the normal walk destinations from the ordered standing marks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cue, clearance mark and optional wait are the only choices not already on the ensemble.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses world metres and the existing named-cue shape; the scheduler resolves the cue and walks.
 */
export interface IAutoMovieMotionHumanQueueAdvance {
  /** A cue track, one of its events, and optionally its zero-based occurrence. */
  on: { of: string; event: string; index?: number };

  /** A floor mark ahead of the head at which that performer finishes walking, in world metres. */
  exit: IAutoMovieVector3;

  /** Seconds each follower waits after the walk immediately ahead ends. Finite and nonnegative, default 0. */
  wait?: number;
}
