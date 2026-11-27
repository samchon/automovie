import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec";

/**
 * One complete frame sequence and optional soundtrack for deterministic FFmpeg
 * argument planning. planVideoEncoding requires a whole-frame positive
 * clock and an even raster before any draw; audio null disables muxing. The
 * planner returns arguments and never opens paths or starts processes.
 */
export interface IAutoMoviePlanVideoEncodingProps {
  /** The output raster, rate and encoding. */
  spec: IAutoMovieRenderSpec;

  /** Running time in seconds. */
  durationSeconds: number;

  /** Folder of the frame files, named by `AutoMovieRenderMedia.frameName`. */
  frameDir: string;

  /** The video file FFmpeg writes. */
  outputPath: string;

  /** A complete soundtrack to mux, or null for none. */
  audio: string | null;
}
