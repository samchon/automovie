import type { IAutoMovieRenderChunk } from "./IAutoMovieRenderChunk";
import type { IAutoMovieRenderPassManifest } from "./IAutoMovieRenderPassManifest";
import type { IAutoMovieRenderReassembly } from "./IAutoMovieRenderReassembly";
import type { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan";

/**
 * A long sequence render split into independently renderable chunks plus the
 * plan to reassemble them.
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
   * Per-pass whole-timeline walk orders, present only when guide passes were
   * requested. The `beauty` pass has a video-concatenation plan through
   * {@link reassembly}; tagged passes remain frame sequences whose walk order
   * describes their reassembly for a consuming host.
   */
  passManifests?: IAutoMovieRenderPassManifest[];
}
