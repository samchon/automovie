import type { IAutoMovieRecoveryImageChart } from "./IAutoMovieRecoveryImageChart";
import type { IAutoMovieRecoveryImageObservationRow } from "./IAutoMovieRecoveryImageObservationRow";

/**
 * Measured support rows and quantization in their original supplied image
 * chart.
 */
export interface IAutoMovieRecoveryImageObservationView extends IAutoMovieRecoveryImageChart {
  /**
   * Original occupied pixel-cell support intervals, ordered by strictly
   * increasing Y.
   */
  rows: IAutoMovieRecoveryImageObservationRow[];

  /**
   * Exactly half the camera pitch, millimetres; covers ideal quantization, not
   * segmentation or calibration error.
   */
  quantizationMm: number;
}
