import type { IAutoMovieRecoveryImageChart } from "./IAutoMovieRecoveryImageChart";

/** Resident RGB pixels and their supplied chart for one fixed-object view. */
export interface IAutoMovieRecoveryImageView extends IAutoMovieRecoveryImageChart {
  /**
   * Borrowed row-major unsigned sRGB bytes, exactly 3 * width * height without
   * alpha; stable until synchronous observation returns.
   */
  rgb8: Uint8Array;
}
