import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";
import type { IAutoMovieCaptureWindow } from "./IAutoMovieCaptureWindow.js";

/**
 * Deduplicated ordered sample instants and their event/cut windows.
 * planAutoMovieCaptureFrames rounds grid samples to the nearest frame,
 * preserves explicit off-grid instants, clips windows to available frames, and
 * retains each event window even when it overlaps another.
 */
export interface IAutoMovieCaptureFramePlan {
  /** Every instant drawn, in time order without repeats. */
  times: IAutoMovieCaptureTime[];

  /** The frames drawn around each event, then each cut. */
  windows: IAutoMovieCaptureWindow[];
}
