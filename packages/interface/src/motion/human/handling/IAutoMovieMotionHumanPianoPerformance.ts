import type { IAutoMovieMotionHumanPianoPedal } from "./IAutoMovieMotionHumanPianoPedal";
import type { IAutoMovieMotionHumanPianoScore } from "./IAutoMovieMotionHumanPianoScore";

/**
 * A keyboard score and a damper-pedal part on the same upright. Both parts
 * use action seconds from a common start, and either can finish first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the shared clock and independent parts.
 * @evidence contracts/development/design.md#principled-representation Reuses score and pedal authoring with a single instrument identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds the combined authoring boundary only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pedal retains its independent clock instead of following note events.
 */
export interface IAutoMovieMotionHumanPianoPerformance extends IAutoMovieMotionHumanPianoScore {
  /** The timed right-foot part on the same instrument as the score. */
  pedal: Omit<IAutoMovieMotionHumanPianoPedal, "prop">;
}
