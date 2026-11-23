import type { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass.js";

/**
 * One guide pass's whole-timeline walk order across the chunks: how a host
 * visits every frame of the pass without a video concatenation.
 *
 * Tagged passes end as frame sequences, so this manifest describes their
 * reassembly; the per-chunk input patterns let a host that wants a video encode
 * one per chunk.
 */
export interface IAutoMovieRenderPassManifest {
  /** The guide pass this manifest walks. */
  pass: AutoMovieGuidePass;

  /** Chunk frame directories in play order. */
  chunkFrameDirs: string[];

  /**
   * Per-chunk ffmpeg input patterns for this pass, parallel to
   * {@link chunkFrameDirs}.
   */
  inputPatterns: string[];

  /**
   * Total frames of the pass across all chunks, equal to the plan's frame
   * count.
   */
  frameCount: number;
}
