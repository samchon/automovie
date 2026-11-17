import type { IAutoMovieRenderSpec } from "../../cinematics/IAutoMovieRenderSpec.js";

/**
 * One complete frame sequence and optional soundtrack for deterministic FFmpeg argument planning. planAutoMovieVideoEncoding requires a whole-frame positive clock and an even raster before any draw; audio null disables muxing. The planner returns arguments and never opens paths or starts processes.
 *
 * @evidence contracts/development/design.md#principled-representation The planner returns arguments and never opens paths or starts processes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieVideoEncoding exchanges spec, durationSeconds, frameDir, outputPath, audio; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The planner returns arguments and never opens paths or starts processes.
 * @evidence contracts/development/common.md#meaningful-documentation One complete frame sequence and optional soundtrack for deterministic FFmpeg argument planning. planAutoMovieVideoEncoding requires a whole-frame positive clock and an even raster before any draw; audio null disables muxing. The prose and members document how planAutoMovieVideoEncoding interprets and admits these values.
 */
export interface IAutoMoviePlanVideoEncodingProps {
  /** The output raster, rate and encoding. */
  spec: IAutoMovieRenderSpec;

  /** Running time in seconds. */
  durationSeconds: number;

  /** Folder of the frame files, named by `frameName`. */
  frameDir: string;

  /** The video file FFmpeg writes. */
  outputPath: string;

  /** A complete soundtrack to mux, or null for none. */
  audio: string | null;
}
