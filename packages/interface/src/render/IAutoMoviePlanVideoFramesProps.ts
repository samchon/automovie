/**
 * An encoded file and desired decoded frame indices for an FFmpeg extraction
 * plan. planVideoFrames refuses an empty list or
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

  /** Absolute input stream index. Omitted selects the first video stream. */
  streamIndex?: number;

  /** Preserve source PTS and write the selected frame timing to the FFmpeg log. */
  presentation?: boolean;
}
