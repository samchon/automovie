/**
 * Host I/O for rendering a clip. Scheduling remains deterministic while the
 * caller owns capture, encoding and cleanup of files, sessions and processes.
 */
export interface IAutoMovieRenderAdapters {
  /**
   * Render the scene at clip-local `timeSeconds` and write frame `index` into
   * `dir` under its {@link frameName}. Returns the written path.
   */
  captureFrame: (
    timeSeconds: number,
    index: number,
    dir: string,
  ) => Promise<string>;

  /** Run ffmpeg with `args` (from {@link ffmpegArgs}); resolve with `outputPath`. */
  encode: (args: string[], outputPath: string) => Promise<string>;
}
