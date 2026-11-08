import { AutoMovieGuidePass } from "@automovie/interface";

/**
 * One guide pass's whole-timeline walk order across the chunks: how a host visits every frame of the pass without a video concatenation.
 *
 * Tagged passes end as frame sequences, so this manifest describes their reassembly; the per-chunk input patterns let a host that wants a video encode one per chunk.
 *
 * @evidence contracts/development/design.md#principled-representation Two arrays parallel to the chunk list describe the walk, because the chunk directories already order the frames and the pass tag only changes the file pattern inside each directory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The manifest carries only directories, patterns and the total, and leaves frame-level paths to each chunk's `passOutputs`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The beauty pass gets a manifest like every other pass, and no pass name is treated specially here; the beauty pass additionally reassembles as video through the concat plan.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states that this is how a tagged pass is reassembled and why patterns are included; members state order, parallelism and the frame total.
 */
export interface IAutoMovieRenderPassManifest {
  /** The guide pass this manifest walks. */
  pass: AutoMovieGuidePass;

  /** Chunk frame directories in play order. */
  chunkFrameDirs: string[];

  /** Per-chunk ffmpeg input patterns for this pass, parallel to {@link chunkFrameDirs}. */
  inputPatterns: string[];

  /** Total frames of the pass across all chunks, equal to the plan's frame count. */
  frameCount: number;
}
