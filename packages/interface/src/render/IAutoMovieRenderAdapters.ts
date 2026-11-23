/**
 * Host I/O for rendering a clip. Scheduling remains deterministic while the caller owns capture, encoding and cleanup of files, sessions and processes.
 *
 * @evidence contracts/development/design.md#principled-representation Separate asynchronous capture and encoding callbacks expose the two host effects while preserving clip-local seconds and frame naming at the capture boundary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The renderer-agnostic loop receives host I/O through this record so no browser, GPU or ffmpeg implementation enters scheduling.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callbacks are the supported injection seam, not replacements for a global or foreign method; their failures remain rejected promises.
 * @evidence contracts/development/common.md#meaningful-documentation Members define clip-local seconds, zero-based index, destination directory, encoder arguments and returned written paths.
 */
export interface IAutoMovieRenderAdapters {
  /**
   * Render the scene at clip-local `timeSeconds` and write frame `index` into `dir` under its {@link frameName}. Returns the written path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member defines clip-local seconds, frame ordinal, destination directory and returned path; the host must honor those naming and timing inputs, and reporting a path alone does not prove a file was written.
   */
  captureFrame: (
    timeSeconds: number,
    index: number,
    dir: string,
  ) => Promise<string>;

  /**
   * Run ffmpeg with `args` (from {@link ffmpegArgs}); resolve with `outputPath`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states the planned encoder arguments and requested output path. Implementations must preserve those inputs while encoding; returning a string does not prove container or pixel correctness.
   */
  encode: (args: string[], outputPath: string) => Promise<string>;
}
