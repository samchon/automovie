import type { IAutoMovieRenderChunk } from "./IAutoMovieRenderChunk";
import type { IAutoMovieRenderPassManifest } from "./IAutoMovieRenderPassManifest";
import type { IAutoMovieRenderReassembly } from "./IAutoMovieRenderReassembly";
import { IAutoMovieSequenceRenderPlan } from "./sequenceRenderPlan";

/**
 * A long sequence render split into independently renderable chunks plus the plan to reassemble them.
 *
 * @evidence contracts/common.md#principled-implementation The plan keeps the whole render's identity, rate and frame total beside the chunks, so a host can check that the chunks cover the render before reassembling it.
 * @evidence contracts/common.md#clear-and-simple-design Chunks, the video reassembly and the optional pass manifests are separate fields because the beauty video and tagged frame sequences finish differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent `passManifests` means no passes were requested, and the plan carries no host-specific field.
 * @evidence contracts/common.md#meaningful-documentation The prose states what the plan holds; members state what is copied from the whole plan, the shorter last chunk, and when pass manifests are present and how beauty and tagged passes finish.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The chunk plan type runs no code; producing it is answered on `planChunkedSequenceRender`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A chunk plan is a value handed to a host and coordinates no shared work itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased plan schema acquires no chunk or capture session; planChunkedSequenceRender creates relabelled frame records, chunk and pass lists, and reassembly strings retained by its caller. Actual capture and encoder lifetime belong to the supplied host.
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
