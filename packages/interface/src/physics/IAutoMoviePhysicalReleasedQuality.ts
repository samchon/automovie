/**
 * Additional native solver budget of one body for its released quality. Additional native solver budget of one body for its released quality.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates world iteration counts from a body's optional released-quality totals. Identifies additional solver and internal PGS counts rather than replacement world totals.
 * @evidence contracts/development/design.md#principled-representation Iteration counts are dimensionless budgets; released chooses whether the body's declared minimum participates. Both nonnegative counts are the positive part of requested released total minus world count.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalReleasedQuality computes additional per-body Rapier iterations from simulation-admitted world and body settings. Physical world tracking applies these per-body additions to every rigid segment of the released scene body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Outside release or without a declaration no additional count is requested; total requests below world quality never subtract iterations. The result requests native island quality and does not claim independent per-body convergence or successful contact resolution.
 */
export namespace IAutoMoviePhysicalReleasedQuality {
  /**
   * Additional native solver budget of one body for its released quality.
   *
   * A released body may declare a higher articulation solver budget than the
   * world's; Rapier adds per-body iterations on top of the world's own, so the
   * addition is the declared total minus the world's count, never negative.
   * Outside release, or without a declaration, nothing is added.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates world iteration counts from a body's optional released-quality totals.
   * @evidence contracts/development/design.md#principled-representation Iteration counts are dimensionless budgets; released chooses whether the body's declared minimum participates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalReleasedQuality computes additional per-body Rapier iterations from simulation-admitted world and body settings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Outside release or without a declaration no additional count is requested; total requests below world quality never subtract iterations.
   */
  export type IInput = {
    /** Declared released totals, when the body has a released quality policy. */ quality?: {
      /** Total articulation solver iterations while released. */ iterations: number;
      /** Total internal PGS iterations while released. */ internalIterations: number;
    };
    /** Whether the body's default tracking is currently withdrawn. */ released: boolean;
    /** World solver iterations per step. */ iterations: number;
    /** World internal PGS iterations per step. */ internalIterations: number;
  };

  /**
   * Additional native solver budget of one body for its released quality.
   *
   * A released body may declare a higher articulation solver budget than the
   * world's; Rapier adds per-body iterations on top of the world's own, so the
   * addition is the declared total minus the world's count, never negative.
   * Outside release, or without a declaration, nothing is added.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies additional solver and internal PGS counts rather than replacement world totals.
   * @evidence contracts/development/design.md#principled-representation Both nonnegative counts are the positive part of requested released total minus world count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Physical world tracking applies these per-body additions to every rigid segment of the released scene body.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result requests native island quality and does not claim independent per-body convergence or successful contact resolution.
   */
  export type IResult = {
    /** Additional solver iterations to set on every rigid body of the body. */ solver: number;
    /** Additional internal PGS iterations to set on every rigid body of the body. */ pgs: number;
  };
}
