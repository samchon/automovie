/**
 * Capture host readiness and the full advertised presentation clock. assertAutoMovieCaptureClock requires ready, exact expected duration/rate equality and a safe-integer frameCount equal to their product. This observation is not a proof that all frames have been drawn.
 *
 * @evidence contracts/development/design.md#principled-representation This observation is not a proof that all frames have been drawn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assertAutoMovieCaptureClock exchanges ready, durationSeconds, fps, frameCount; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This observation is not a proof that all frames have been drawn.
 * @evidence contracts/development/common.md#meaningful-documentation Capture host readiness and the full advertised presentation clock. assertAutoMovieCaptureClock requires ready, exact expected duration/rate equality and a safe-integer frameCount equal to their product. The prose and members document how assertAutoMovieCaptureClock interprets and admits these values.
 */
export interface IAutoMovieAssertCaptureClockHost {
  /** Whether the host reports the complete clock ready for capture. */
  ready: boolean;
  /** Full subject duration in seconds, exactly matching the commission. */
  durationSeconds: number;
  /** Advertised output frames per second, exactly matching the commission. */
  fps: number;
  /** Full output frame count, a safe integer equal to durationSeconds times fps. */
  frameCount: number;
}
