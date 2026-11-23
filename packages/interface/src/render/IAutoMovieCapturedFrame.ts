/** One captured frame artifact. */
export interface IAutoMovieCapturedFrame {
  /** Zero-based frame index. */
  index: number;

  /** Clip-local sample time in seconds. */
  timeSeconds: number;

  /** Host path returned by `captureFrame`. */
  path: string;
}
