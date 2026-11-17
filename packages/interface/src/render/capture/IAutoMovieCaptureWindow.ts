/**
 * The consecutive frames a capture draws around one event or cut, as the record lists them.
 *
 * The window is every frame from `first` to `last` of the subject's grid; it is the requested number of frames on each side of `frame`, cut at the subject's first and last frame, and `clipped` says when it was.
 *
 * @evidence contracts/development/design.md#principled-representation An instant, the frame nearest it and the inclusive range of frames drawn around it, in frame indices of the subject's grid, so the record shows which frames were planned and where the bounds cut them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the record; the cells carry the frames themselves. `kind` separates instants the caller named from cuts the file revealed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A window cut at the bounds says so instead of silently drawing fewer frames.
 * @evidence contracts/development/common.md#meaningful-documentation States what the range holds, how it is bounded and what `clipped` reports.
 */
export interface IAutoMovieCaptureWindow {
  /** `event` for an instant the request named, `cut` for a scene cut detected in a file. */
  kind: "event" | "cut";

  /** The instant in seconds, as named or detected. */
  seconds: number;

  /** Index of the frame nearest the instant, which may lie outside the subject when the instant is at its end. */
  frame: number;

  /** First frame drawn, inclusive. */
  first: number;

  /** Last frame drawn, inclusive. */
  last: number;

  /** Whether the subject's first or last frame cut the window short. */
  clipped: boolean;
}
