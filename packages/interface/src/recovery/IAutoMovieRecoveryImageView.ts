import type { IAutoMovieRecoveryImageChart } from "./IAutoMovieRecoveryImageChart";

/**
 * A single calibrated resident RGB8 view of the fixed object. Pair the
 * inherited chart with the exact current raster bytes, and keep both stable
 * until observation returns.
 */
export interface IAutoMovieRecoveryImageView extends IAutoMovieRecoveryImageChart {
  /**
   * Row-major red, green and blue bytes, with exactly three bytes per pixel and
   * no alpha. Borrowed until the synchronous call returns.
   */
  rgb8: Uint8Array;
}
