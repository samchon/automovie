import type { IAutoMovieMotionHumanPianoPedal } from "./IAutoMovieMotionHumanPianoPedal";
import type { IAutoMovieMotionHumanPianoScore } from "./IAutoMovieMotionHumanPianoScore";

/**
 * A keyboard score and a damper-pedal part on the same upright. Both parts use
 * action seconds from a common start, and either can finish first.
 */
export interface IAutoMovieMotionHumanPianoPerformance extends IAutoMovieMotionHumanPianoScore {
  /** The timed right-foot part on the same instrument as the score. */
  pedal: Omit<IAutoMovieMotionHumanPianoPedal, "prop">;
}
