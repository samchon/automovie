/**
 * One linear interval constraint of a quadratic program, `lower <= sum of
 * weights[k] * x[indices[k]] <= upper`, in sparse form.
 *
 * Only the listed variables take part; every other coefficient is zero. Equal
 * endpoints make an equality. A row with no indices constrains the constant
 * zero, so a lower endpoint above zero or an upper endpoint below zero makes
 * the program infeasible. `admitAutoMovieQuadraticProgram` refuses a row that
 * breaks a rule stated on a member.
 *
 * @evidence contracts/common.md#principled-implementation An index list and a parallel weight list are the row-wise sparse form of one constraint row, the coordinate-list layout `assembleAutoMovieQuadraticProgram` transposes into compressed columns, and two nullable endpoints cover equality, one-sided and two-sided rows in one shape, matching the interval rows the Clarabel bridge splits into its zero and nonnegative cones.
 * @evidence contracts/common.md#clear-and-simple-design A plain record with no row kind or flags, because the endpoints alone say whether a row is an equality, one-sided or two-sided, and the same shape serves the program solver, the working-set step, the displacement solvers and the human garment and face closure fits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unbounded is a null endpoint rather than an infinity or a large stand-in number, so the kernel's `1e30` sentinel stays private to the assembly and no caller can pass a magnitude that collides with it.
 * @evidence contracts/common.md#meaningful-documentation States the inequality the row encodes, that unlisted variables have zero coefficients, what equal endpoints and an empty row mean, and per member the index range and uniqueness, the parallel length, finiteness, the sentinel limit, inclusiveness and what null means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the sparse layout's cost is answered on `assembleAutoMovieQuadraticProgram`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record a caller builds per constraint; nothing about it is cached or shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds two caller-owned arrays and two scalars; the program solvers only read them and keep no reference after returning.
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
