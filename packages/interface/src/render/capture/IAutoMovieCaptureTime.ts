/**
 * One instant a capture draws: a second of the subject, and the frame of its
 * grid when the second is one.
 *
 * Seconds sampled evenly or around an event or cut are always frames, `frame /
 * fps`. A second given explicitly through `at` is kept as written and has a
 * frame only when it falls on the grid.
 */
export interface IAutoMovieCaptureTime {
  /** Second of the subject, zero or more. */
  seconds: number;

  /**
   * Index of the frame on the subject's grid that shows this second, from zero,
   * or null when the second falls between frames.
   */
  frame: number | null;
}
