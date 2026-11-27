/**
 * Capture host readiness and the full advertised presentation clock.
 * assertAutoMovieCaptureClock requires ready, exact expected duration/rate
 * equality and a safe-integer frameCount equal to their product. This
 * observation is not a proof that all frames have been drawn.
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
