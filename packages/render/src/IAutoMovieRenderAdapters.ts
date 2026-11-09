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
   * @evidence contracts/development/implementation.md#principled-implementation renderVideo supplies each scheduled clip-local second and zero-based index in order, awaiting this promise before the next capture. The host is responsible for drawing and writing the corresponding frame, and the returned path is reported without independent filesystem or pixel validation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three scalar capture arguments keep scene and renderer ownership with the supplied host, separate from the deterministic schedule and later encoder call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This declared effect seam supplies the host operation instead of replacing a global renderer; rejection stops renderVideo before encoding, and the signature supplies no synthetic-frame fallback.
   * @evidence contracts/development/common.md#meaningful-documentation The member defines clip-local seconds, frame ordinal, destination directory and returned path; the host must honor those naming and timing inputs, and reporting a path alone does not prove a file was written.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This erased callback signature selects no drawing or filesystem algorithm. renderVideo owns its O(F) scheduling loop, and the concrete host owns each frame's capture and write costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature shares no capture work; renderVideo requests distinct scheduled frames, while the host must establish equivalence before reusing any rendered data or effect.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This erased member opens no session or file. The supplied capture implementation owns its drawing resources and written files, including cleanup after rejection; renderVideo retains the reported path in caller-owned result metadata and has no host cleanup capability.
   */
  captureFrame: (
    timeSeconds: number,
    index: number,
    dir: string,
  ) => Promise<string>;

  /**
   * Run ffmpeg with `args` (from {@link ffmpegArgs}); resolve with `outputPath`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation renderVideo calls this capability once after every capture succeeds, supplying ffmpegArgs' planned argument vector and destination. The host owns actual encoding and must return its written output path; the orchestrator neither starts ffmpeg itself nor verifies the resulting container.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Encoding is a separate asynchronous effect from frame capture, so the scheduling loop can await one host result without owning an encoder implementation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The host callback is the declared process seam; a rejected encode propagates rather than becoming a successful artifact, and no destination or argument vector selects a fixture result.
   * @evidence contracts/development/common.md#meaningful-documentation The member states the planned encoder arguments and requested output path. Implementations must preserve those inputs while encoding; returning a string does not prove container or pixel correctness.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This erased encoder signature chooses no codec algorithm. The concrete implementation owns input-frame reading, codec work and output writing; renderVideo merely awaits one call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature coordinates no encoder cache; a host cannot equate encoding effects solely by destination name, and renderVideo invokes this capability once per render attempt.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This erased member launches no process or output stream. The host owns encoder resources and cleanup on success or rejection, while renderVideo retains its reported output path and argument array in caller-owned metadata.
   */
  encode: (args: string[], outputPath: string) => Promise<string>;
}
