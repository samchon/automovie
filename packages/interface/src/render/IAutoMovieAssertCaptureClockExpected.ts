/**
 * Commissioned duration and rate to compare with a capture host.
 * assertAutoMovieCaptureClock compares them exactly rather than rounding or
 * independently validating their positivity; the commissioning boundary owns
 * numeric admission.
 */
export interface IAutoMovieAssertCaptureClockExpected {
  /** Commissioned full duration in seconds. */
  durationSeconds: number;
  /** Commissioned output frames per second. */
  fps: number;
}
