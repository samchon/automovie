

/**
 * An encoded file and desired decoded frame indices for an FFmpeg extraction plan. planAutoMovieVideoFrames refuses an empty list or nonnegative-safe-integer violations, then deduplicates and sorts indices. Output stills are numbered by extraction order as s00000.png; this contract does not launch the process.
 *
 * @evidence contracts/development/design.md#principled-representation Output stills are numbered by extraction order as s00000.png; this contract does not launch the process.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieVideoFrames exchanges file, frames, directory; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Output stills are numbered by extraction order as s00000.png; this contract does not launch the process.
 * @evidence contracts/development/common.md#meaningful-documentation An encoded file and desired decoded frame indices for an FFmpeg extraction plan. planAutoMovieVideoFrames refuses an empty list or nonnegative-safe-integer violations, then deduplicates and sorts indices. The prose and members document how planAutoMovieVideoFrames interprets and admits these values.
 */
export interface IAutoMoviePlanVideoFramesProps {
  /** Path of the video file. */
  file: string;

  /** Indices of the frames to extract, from zero. */
  frames: readonly number[];

  /** Folder the stills are written into. */
  directory: string;
}
