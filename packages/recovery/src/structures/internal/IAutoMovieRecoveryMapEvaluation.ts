import type { IAutoMovieRecoveryMapJointBlock } from "./IAutoMovieRecoveryMapJointBlock";

/**
 * Actual fixed-population objective and its matching weighted local blocks.
 *
 * @evidence contracts/development/design.md#principled-representation Complete-vector soft-L1 cost and unweighted squared error are measured from the same observed pixels used to form the weighted original design.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The nonlinear owner retains objective scalars with their current linearization in one named state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A reduced cost does not imply every pixel gate or allow changed-population comparison.
 * @evidence contracts/development/common.md#meaningful-documentation Fields state objective normalization and common observation ownership.
 */
export interface IAutoMovieRecoveryMapEvaluation {
  /** Sum lossScale^2*(sqrt(1+norm(residual)^2/lossScale^2)-1). */
  cost: number;

  /** Sum unweighted squared Euclidean pixel residuals. */
  squared: number;

  /** One weighted original-design block per ordered landmark. */
  blocks: IAutoMovieRecoveryMapJointBlock[];
}
