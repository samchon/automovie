import type { IAutoMovieRenderChunk } from "./IAutoMovieRenderChunk.js";
import type { IAutoMovieRenderPassManifest } from "./IAutoMovieRenderPassManifest.js";
import type { IAutoMovieRenderReassembly } from "./IAutoMovieRenderReassembly.js";
import { IAutoMovieSequenceRenderPlan } from "./sequenceRenderPlan.js";

/**
 * A long sequence render split into independently renderable chunks plus the plan to reassemble them.
 *
 * @evidence contracts/development/design.md#principled-representation The plan keeps the whole render's identity, rate and frame total beside the chunks, so a host can check that the chunks cover the render before reassembling it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Chunks, the video reassembly and the optional pass manifests are separate fields because the beauty video and tagged frame sequences finish differently.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent `passManifests` means no passes were requested, and the plan carries no host-specific field.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states what the plan holds; members state what is copied from the whole plan, the shorter last chunk, and when pass manifests are present and how beauty and tagged passes finish.
 */
export interface IAutoMovieRenderChunkPlan {
  /** Render target identity, copied from the whole plan. */
  target: IAutoMovieSequenceRenderPlan["target"];

  /** Output frames per second, copied from the whole plan. */
  renderFps: number;

  /** Total output frames across all chunks, equal to the whole plan's. */
  frameCount: number;

  /** Frames per chunk; the last chunk may be shorter. */
  chunkFrames: number;

  /** Number of chunks, `ceil(frameCount / chunkFrames)`. */
  chunkCount: number;

  /** The chunks, in capture order. */
  chunks: IAutoMovieRenderChunk[];

  /** How to stitch the chunk videos into the final video. */
  reassembly: IAutoMovieRenderReassembly;

  /**
   * Per-pass whole-timeline walk orders, present only when guide passes were requested. The `beauty` pass has a video-concatenation plan through {@link reassembly}; tagged passes remain frame sequences whose walk order describes their reassembly for a consuming host.
   */
  passManifests?: IAutoMovieRenderPassManifest[];
}
