

/**
 * Admitted frame count and FFmpeg arguments for a host to execute. planAutoMovieVideoEncoding returns this only after clock and raster checks; the argument vector does not establish that the files exist or that encoding succeeded.
 *
 * @evidence contracts/development/design.md#principled-representation Admitted frame count and FFmpeg arguments for a host to execute. planAutoMovieVideoEncoding returns this only after clock and raster checks; the argument vector does not establish that the files exist or that encoding succeeded.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieVideoEncoding exchanges frameCount, args; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Admitted frame count and FFmpeg arguments for a host to execute. planAutoMovieVideoEncoding returns this only after clock and raster checks; the argument vector does not establish that the files exist or that encoding succeeded.
 * @evidence contracts/development/common.md#meaningful-documentation Admitted frame count and FFmpeg arguments for a host to execute. planAutoMovieVideoEncoding returns this only after clock and raster checks; the argument vector does not establish that the files exist or that encoding succeeded. The prose and members document how planAutoMovieVideoEncoding interprets and admits these values.
 */
export interface IAutoMoviePlanVideoEncodingResult {
  /** Frames the clock holds. */
  frameCount: number;

  /** FFmpeg's arguments. */
  args: string[];
}
