/**
 * One linear interval constraint of a quadratic program, `lower <= sum of
 * weights[k] * x[indices[k]] <= upper`, in sparse form.
 *
 * Only the listed variables take part; every other coefficient is zero. Equal
 * endpoints make an equality. A row with no indices constrains the constant
 * zero, so a lower endpoint above zero or an upper endpoint below zero makes
 * the program infeasible. `admitAutoMovieQuadraticProgram` refuses a row that
 * breaks a rule stated on a member.
 */
export interface IAutoMovieQuadraticRow {
  /**
   * Zero-based variable ordinals with a coefficient in this row, each an
   * integer below the variable count and listed at most once.
   */
  indices: readonly number[];

  /**
   * Coefficient of each listed variable, parallel to `indices` and of the same
   * length. Each is finite with magnitude below `1e30`; an exact zero is kept
   * as an explicit entry.
   */
  weights: readonly number[];

  /**
   * Inclusive lower endpoint, finite with magnitude below `1e30` and at most
   * `upper`, or null when the row has no lower bound.
   */
  lower: number | null;

  /**
   * Inclusive upper endpoint, finite with magnitude below `1e30` and at least
   * `lower`, or null when the row has no upper bound.
   */
  upper: number | null;
}
