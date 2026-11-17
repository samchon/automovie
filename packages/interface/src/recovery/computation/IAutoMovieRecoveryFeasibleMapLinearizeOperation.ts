import type {
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryFeasibleMapLinearization,
  IAutoMovieRecoveryMapState,
} from "../../index";

/**
 * One fixed-population sparse-map objective and hard-disk linearization. Physical state coordinates use the current reconstruction gauge; intrinsics are row-major pixel charts. Constraint rows are dimensionless normalized disk inequalities. The operation throws for nonpositive depth, violated initial disks or nonrepresentable derivatives; rank and trial acceptance remain with the refinement owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for linearizeRecoveryFeasibleMap.
 * @evidence contracts/development/design.md#principled-representation One fixed-population sparse-map objective and hard-disk linearization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface linearizeRecoveryFeasibleMap and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by linearizeRecoveryFeasibleMap; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryFeasibleMapLinearizeOperation {
  /**
   * One fixed-population sparse-map objective and hard-disk linearization. Physical state coordinates use the current reconstruction gauge; intrinsics are row-major pixel charts. Constraint rows are dimensionless normalized disk inequalities. The operation throws for nonpositive depth, violated initial disks or nonrepresentable derivatives; rank and trial acceptance remain with the refinement owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for linearizeRecoveryFeasibleMap.
   * @evidence contracts/development/design.md#principled-representation One fixed-population sparse-map objective and hard-disk linearization.
   * @evidence contracts/development/design.md#minimal-and-owned-surface linearizeRecoveryFeasibleMap and its typed callers share this signature and the referenced canonical input and result records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by linearizeRecoveryFeasibleMap; the type does not certify input validity.
   */
  export type Operation = (
    state: IAutoMovieRecoveryMapState,
    intrinsics: readonly (readonly number[])[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
  ) => IAutoMovieRecoveryFeasibleMapLinearization;
}
