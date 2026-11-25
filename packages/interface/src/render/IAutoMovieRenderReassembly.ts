/**
 * The plan for stitching encoded chunk videos back into one video with ffmpeg's
 * concat demuxer and stream copy.
 *
 * The host writes `concatListLines` to `concatListPath` and runs ffmpeg with
 * `ffmpegArgs`. The list holds chunk basenames because the demuxer resolves a
 * relative entry against the list file's directory, which is also the chunk
 * outputs' directory. Successful stream-copy concatenation requires the host's
 * actual encoded streams to be compatible; a planned argument vector alone does
 * not prove that condition.
 */
export interface IAutoMovieRenderReassembly {
  /** Final video path, the whole plan's `outputPath`. */
  outputPath: string;

  /** Chunk output video paths, in play order. */
  chunkOutputs: string[];

  /** Path of the concat-demuxer list file the host writes, beside the output. */
  concatListPath: string;

  /**
   * Lines of that list, `file '<basename>'` with each apostrophe escaped, in
   * play order.
   */
  concatListLines: string[];

  /** Ffmpeg argument vector that concatenates the chunk videos with stream copy. */
  ffmpegArgs: string[];
}
