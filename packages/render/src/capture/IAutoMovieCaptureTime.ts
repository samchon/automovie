/**
 * One instant a capture draws: a second of the subject, and the frame of its grid when the second is one.
 *
 * Seconds sampled evenly or around an event or cut are always frames, `frame / fps`. A second given explicitly through `at` is kept as written and has a frame only when it falls on the grid.
 *
 * @evidence contracts/development/design.md#principled-representation The drawn second and its frame index on the subject's own grid, the two coordinates a caption and a file pairing read; a second between frames has no index rather than a rounded one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by cell names, captions, records and pairing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The frame is null off the grid instead of a frame that does not show this second.
 * @evidence contracts/development/common.md#meaningful-documentation States when a frame index exists and what each member counts in.
 */
export interface IAutoMovieCaptureTime {
  /** Second of the subject, zero or more. */
  seconds: number;

  /** Index of the frame on the subject's grid that shows this second, from zero, or null when the second falls between frames. */
  frame: number | null;
}
