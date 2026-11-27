import type { IAutoMovieDeliveryContentAudit } from "./IAutoMovieDeliveryContentAudit";

/**
 * Admitted frame count and FFmpeg arguments for a host to execute.
 * planVideoEncoding returns this only after clock and raster checks;
 * the argument vector does not establish that the files exist or that encoding
 * succeeded.
 */
export interface IAutoMoviePlanVideoEncodingResult {
  /** Frames the clock holds. */
  frameCount: number;

  /** Exact positive rate selected for the input and encoded video clocks. */
  frameRate: IAutoMovieDeliveryContentAudit.Ratio;

  /** FFmpeg's arguments. */
  args: string[];
}
