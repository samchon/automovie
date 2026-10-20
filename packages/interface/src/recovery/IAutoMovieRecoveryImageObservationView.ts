import type { IAutoMovieRecoveryImageChart } from "./IAutoMovieRecoveryImageChart";
import type { IAutoMovieRecoveryImageObservationRow } from "./IAutoMovieRecoveryImageObservationRow";

/**
 * Measured support rows and quantization in their original supplied image chart.
 *
 * @evidence contracts/common.md#principled-implementation Increasing physical Y and half-pixel uncertainty preserve support observations independently of fitted section hypotheses; calibration and segmentation errors remain outside this bound.
 * @evidence contracts/common.md#clear-and-simple-design The shared chart owns source/camera metadata while this extension owns measured rows and their quantization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record contains no invented row, source geometry or claim that ideal quantization covers unknown acquisition errors.
 * @evidence contracts/common.md#meaningful-documentation States increasing row order, millimetres and the conditional half-pitch interpretation.
 */
export interface IAutoMovieRecoveryImageObservationView extends IAutoMovieRecoveryImageChart {
  /** Original occupied pixel-cell support intervals, ordered by strictly increasing Y. */
  rows: IAutoMovieRecoveryImageObservationRow[];

  /** Exactly half the camera pitch, millimetres; covers ideal quantization, not segmentation or calibration error. */
  quantizationMm: number;
}
