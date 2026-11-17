import type {
  IAutoMovieRecoverySqpMix,
  IAutoMovieSimplexAtom,
} from "../../index";

/**
 * Mix two physical direction vectors under every original affine inequality. nominal is the caller's dimensionless mixture coefficient. The result retains that nominal attempt separately from at most one computed support candidate; a null step means neither directly checked candidate qualified. Inputs remain borrowed and no objective or geometry callback runs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for mixRecoveryFeasibleSqpStep.
 * @evidence contracts/development/design.md#principled-representation Mix two physical direction vectors under every original affine inequality.
 * @evidence contracts/development/design.md#minimal-and-owned-surface mixRecoveryFeasibleSqpStep and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by mixRecoveryFeasibleSqpStep; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryFeasibleSqpStepMixingOperation {
  /**
   * Mix two physical direction vectors under every original affine inequality. nominal is the caller's dimensionless mixture coefficient. The result retains that nominal attempt separately from at most one computed support candidate; a null step means neither directly checked candidate qualified. Inputs remain borrowed and no objective or geometry callback runs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for mixRecoveryFeasibleSqpStep.
   * @evidence contracts/development/design.md#principled-representation Mix two physical direction vectors under every original affine inequality.
   * @evidence contracts/development/design.md#minimal-and-owned-surface mixRecoveryFeasibleSqpStep and its typed callers share this signature and the referenced canonical input and result records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by mixRecoveryFeasibleSqpStep; the type does not certify input validity.
   */
  export type Operation = (
    rows: readonly IAutoMovieSimplexAtom[],
    sqp: readonly number[],
    tilted: readonly number[],
    nominal: number,
  ) => IAutoMovieRecoverySqpMix;
}
