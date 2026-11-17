import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapJointBlock,
  IAutoMovieRecoveryMapJointStep,
} from "../../index";

/**
 * Eliminate independent three-coordinate landmarks from gauge-fixed camera blocks. minimumRatio qualifies the original undamped designs; finite nonnegative damping defines the same scaled least-squares problem for all blocks. The caller's budget bounds work and retained factors. retainMetric defaults to false; true also retains inverse and transpose actions from this exact damped design. Returned steps use original camera and point coordinates, and failed rank or admission throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for solveRecoveryMapJointStep.
 * @evidence contracts/development/design.md#principled-representation Eliminate independent three-coordinate landmarks from gauge-fixed camera blocks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface solveRecoveryMapJointStep and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by solveRecoveryMapJointStep; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryMapJointStepSolutionOperation {
  /**
   * Eliminate independent three-coordinate landmarks from gauge-fixed camera blocks. minimumRatio qualifies the original undamped designs; finite nonnegative damping defines the same scaled least-squares problem for all blocks. The caller's budget bounds work and retained factors. retainMetric defaults to false; true also retains inverse and transpose actions from this exact damped design. Returned steps use original camera and point coordinates, and failed rank or admission throws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for solveRecoveryMapJointStep.
   * @evidence contracts/development/design.md#principled-representation Eliminate independent three-coordinate landmarks from gauge-fixed camera blocks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface solveRecoveryMapJointStep and its typed callers share this signature and the referenced canonical input and result records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by solveRecoveryMapJointStep; the type does not certify input validity.
   */
  export type Operation = (
    blocks: readonly IAutoMovieRecoveryMapJointBlock[],
    minimumRatio: number,
    damping: number,
    budget: IAutoMovieRecoveryCameraMapBudget,
    retainMetric?: boolean,
  ) => IAutoMovieRecoveryMapJointStep;
}
