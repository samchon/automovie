/**
 * An encoded file and desired decoded frame indices for an FFmpeg extraction
 * plan. planAutoMovieVideoFrames refuses an empty list or
 * nonnegative-safe-integer violations, then deduplicates and sorts indices.
 * Output stills are numbered by extraction order as s00000.png; this contract
 * does not launch the process.
 */
export interface IAutoMoviePlanVideoFramesProps {
  /** Path of the video file. */
  file: string;

  /** Indices of the frames to extract, from zero. */
  frames: readonly number[];

  /** Folder the stills are written into. */
  directory: string;
}
