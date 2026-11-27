import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapJointBlock,
  IAutoMovieRecoveryMapMetricFit,
} from "..";

/**
 * Factor the damped sparse-map metric while independently checking original
 * point and reduced-camera ranks. minimumRatio is the dimensionless
 * original-design threshold and damping is finite and nonnegative. The budget
 * bounds factor work and storage. The returned factor actions retain this
 * admitted block population; they do not compute a least-squares step or
 * establish nonlinear geometric acceptance. Invalid admission or unresolved
 * rank throws.
 */
export namespace IAutoMovieRecoveryMapMetricFactorizationOperation {
  /**
   * Factor the damped sparse-map metric while independently checking original
   * point and reduced-camera ranks. minimumRatio is the dimensionless
   * original-design threshold and damping is finite and nonnegative. The budget
   * bounds factor work and storage. The returned factor actions retain this
   * admitted block population; they do not compute a least-squares step or
   * establish nonlinear geometric acceptance. Invalid admission or unresolved
   * rank throws.
   */
  export type Operation = (
    blocks: readonly IAutoMovieRecoveryMapJointBlock[],
    minimumRatio: number,
    damping: number,
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoveryMapMetricFit;
}
