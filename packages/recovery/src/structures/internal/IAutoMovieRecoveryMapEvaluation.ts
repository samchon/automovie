import type { IAutoMovieRecoveryMapJointBlock } from "./IAutoMovieRecoveryMapJointBlock";

/**
 * Actual fixed-population objective and its matching weighted local blocks.
 *
 * @evidence contracts/common.md#principled-implementation Complete-vector soft-L1 cost and unweighted squared error are measured from the same observed pixels used to form the weighted original design.
 * @evidence contracts/common.md#clear-and-simple-design The nonlinear owner retains objective scalars with their current linearization in one named state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reduced cost does not imply every pixel gate or allow changed-population comparison.
 * @evidence contracts/common.md#meaningful-documentation Fields state objective normalization and common observation ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only current-model O(E*C+L) scalars remain until accepted replacement or fit completion.
 */
export interface IAutoMovieRecoveryMapEvaluation {
  /** Sum lossScale^2*(sqrt(1+norm(residual)^2/lossScale^2)-1). */
  cost: number;

  /** Sum unweighted squared Euclidean pixel residuals. */
  squared: number;

  /** One weighted original-design block per ordered landmark. */
  blocks: IAutoMovieRecoveryMapJointBlock[];
}
