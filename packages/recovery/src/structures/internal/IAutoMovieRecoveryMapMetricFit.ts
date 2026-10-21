import type { IAutoMovieRecoveryMapMetric } from "./IAutoMovieRecoveryMapMetric";

/**
 * Original-rank-qualified raw arrowhead metric without an LS answer.
 *
 * @evidence contracts/common.md#principled-implementation Undamped point/camera ranks and raw damped QR define the same scaled metric used by feasible physical certificates.
 * @evidence contracts/common.md#clear-and-simple-design The operation returns only the metric and two ranks its consumer needs, without fictional step or gradient members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Metric support never replaces actual gates or normal KKT and does not certify an uncomputed normalized damped SVD or LS solution.
 * @evidence contracts/common.md#meaningful-documentation Members separate current damped action from original undamped qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased output performs no factorization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current factor closures and scalars transfer; preparation and original rank-factor records do not escape.
 */
export interface IAutoMovieRecoveryMapMetricFit {
  /** Current raw damped metric with original physical global column scales. */
  metric: IAutoMovieRecoveryMapMetric;

  /** Independently qualified original reduced-camera singular ratio. */
  cameraDesignRatio: number;

  /** Minimum original point-design singular ratio. */
  minimumPointDesignRatio: number;
}
