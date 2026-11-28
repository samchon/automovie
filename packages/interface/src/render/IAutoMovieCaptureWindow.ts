/**
 * The consecutive frames a capture draws around one event or cut, as the record
 * lists them.
 *
 * The window is every frame from `first` to `last` of the subject's grid; it is
 * the requested number of frames on each side of `frame`, cut at the subject's
 * first and last frame, and `clipped` says when it was.
 */
export interface IAutoMovieCaptureWindow {
  /**
   * `event` for an instant the request named, `cut` for a scene cut detected in
   * a file.
   */
  kind: "event" | "cut";

  /** The instant in seconds, as named or detected. */
  seconds: number;

  /**
   * Native index nearest the instant, clamped to the final encoded frame at
   * the subject's terminal bound.
   */
  frame: number;

  /** First frame drawn, inclusive. */
  first: number;

  /** Last frame drawn, inclusive. */
  last: number;

  /** Whether the subject's first or last frame cut the window short. */
  clipped: boolean;
}
