import type { IAutoMovieRecoveryMapMetric } from "./IAutoMovieRecoveryMapMetric";
import type { IAutoMovieRecoveryMapMetricScales } from "./IAutoMovieRecoveryMapMetricScales";

/**
 * Original-rank-qualified raw arrowhead metric without an LS answer.
 *
 * @evidence contracts/development/design.md#principled-representation Undamped point/camera ranks and raw damped QR define the same scaled metric used by feasible physical certificates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Metric, two independent rank diagnostics and shared original D references serve current whitening and optional curvature, without fictional step or gradient members or a retained preparation closure.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Metric support never replaces actual gates or normal KKT and does not certify an uncomputed normalized damped SVD or LS solution.
 * @evidence contracts/development/common.md#meaningful-documentation Members separate current damped action from original undamped qualification.
 */
export interface IAutoMovieRecoveryMapMetricFit extends IAutoMovieRecoveryMapMetricScales {
  /** Current raw damped metric with original physical global column scales. */
  metric: IAutoMovieRecoveryMapMetric;

  /** Independently qualified original reduced-camera singular ratio. */
  cameraDesignRatio: number;

  /** Minimum original point-design singular ratio. */
  minimumPointDesignRatio: number;
}
