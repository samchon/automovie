import type {
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryFeasibleMapLinearization,
  IAutoMovieRecoveryMapState,
} from "../../index";

/**
 * One fixed-population sparse-map objective and hard-disk linearization.
 * Physical state coordinates use the current reconstruction gauge; intrinsics
 * are row-major pixel charts. Constraint rows are dimensionless normalized disk
 * inequalities. The operation throws for nonpositive depth, violated initial
 * disks or nonrepresentable derivatives; rank and trial acceptance remain with
 * the refinement owner.
 */
export namespace IAutoMovieRecoveryFeasibleMapLinearizeOperation {
  /**
   * One fixed-population sparse-map objective and hard-disk linearization.
   * Physical state coordinates use the current reconstruction gauge; intrinsics
   * are row-major pixel charts. Constraint rows are dimensionless normalized
   * disk inequalities. The operation throws for nonpositive depth, violated
   * initial disks or nonrepresentable derivatives; rank and trial acceptance
   * remain with the refinement owner.
   */
  export type Operation = (
    state: IAutoMovieRecoveryMapState,
    intrinsics: readonly (readonly number[])[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
  ) => IAutoMovieRecoveryFeasibleMapLinearization;
}
