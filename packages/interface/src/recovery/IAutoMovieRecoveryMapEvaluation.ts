import type { IAutoMovieRecoveryMapJointBlock } from "..";

/** Actual fixed-population objective and its matching weighted local blocks. */
export interface IAutoMovieRecoveryMapEvaluation {
  /** Sum lossScale^2*(sqrt(1+norm(residual)^2/lossScale^2)-1). */
  cost: number;

  /** Sum unweighted squared Euclidean pixel residuals. */
  squared: number;

  /** One weighted original-design block per ordered landmark. */
  blocks: IAutoMovieRecoveryMapJointBlock[];
}
