import type { IAutoMovieRecoveryImageChart } from "./IAutoMovieRecoveryImageChart";
import type { IAutoMovieRecoveryImageObservationRow } from "./IAutoMovieRecoveryImageObservationRow";

/**
 * Retain the original supplied image chart with its measured foreground rows
 * and half-pixel quantization in millimetres. Rows follow increasing physical
 * Y.
 */
export interface IAutoMovieRecoveryImageObservationView extends IAutoMovieRecoveryImageChart {
  /**
   * Original occupied pixel-cell intervals ordered by strictly increasing
   * physical Y. An admitted view contains at least four rows.
   */
  rows: IAutoMovieRecoveryImageObservationRow[];

  /**
   * Half the supplied pixel pitch in millimetres, representing ideal pixel
   * quantization.
   */
  quantizationMm: number;
}
