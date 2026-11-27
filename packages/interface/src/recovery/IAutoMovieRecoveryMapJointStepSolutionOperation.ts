import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapJointBlock,
  IAutoMovieRecoveryMapJointStep,
} from "..";

/**
 * Eliminate independent three-coordinate landmarks from gauge-fixed camera
 * blocks. minimumRatio qualifies the original undamped designs; finite
 * nonnegative damping defines the same scaled least-squares problem for all
 * blocks. The caller's budget bounds work and retained factors. retainMetric
 * defaults to false; true also retains inverse and transpose actions from this
 * exact damped design. Returned steps use original camera and point
 * coordinates, and failed rank or admission throws.
 */
export namespace IAutoMovieRecoveryMapJointStepSolutionOperation {
  /**
   * Eliminate independent three-coordinate landmarks from gauge-fixed camera
   * blocks. minimumRatio qualifies the original undamped designs; finite
   * nonnegative damping defines the same scaled least-squares problem for all
   * blocks. The caller's budget bounds work and retained factors. retainMetric
   * defaults to false; true also retains inverse and transpose actions from
   * this exact damped design. Returned steps use original camera and point
   * coordinates, and failed rank or admission throws.
   */
  export type Operation = (
    blocks: readonly IAutoMovieRecoveryMapJointBlock[],
    minimumRatio: number,
    damping: number,
    budget: IAutoMovieRecoveryCameraMapBudget,
    retainMetric?: boolean,
  ) => IAutoMovieRecoveryMapJointStep;
}
