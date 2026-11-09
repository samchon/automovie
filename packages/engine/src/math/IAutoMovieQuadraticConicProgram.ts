/**
 * Call-owned standard form min x'Px/2+q'x, Ax+s=b, with zero slacks before
 * `equalities` and nonnegative slacks afterwards. P is diagonal. Scaling means
 * original x=D*xhat and original z=E*zhat/c; authored data remains separate.
 *
 * @evidence contracts/development/design.md#principled-representation Represents precisely the diagonal PSD, equality and interval problem after signed conic expansion and reversible diagonal equilibration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This private numerical record joins conic assembly, factors, directions and residuals without exposing cone construction to callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every stored coefficient, including zero and tiny nonzero values, remains represented; scaling records invert the coordinate change.
 * @evidence contracts/development/common.md#meaningful-documentation Documents standard form, cone partition, diagonal objective, dual sign mapping and inverse scaling.
 */
export interface IAutoMovieQuadraticConicProgram {
  /** Number of primal variables. */
  n: number;

  /** Number of expanded conic constraint rows. */
  m: number;

  /** First nonnegative row; earlier rows have zero slack and free dual. */
  equalities: number;

  /** Owned, equilibrated diagonal Hessian. */
  p: Float64Array;

  /** Owned, equilibrated linear objective. */
  q: Float64Array;

  /** Owned, equilibrated constraint right-hand sides. */
  b: Float64Array;

  /** Column pointers into expanded A, including explicit zero coefficients. */
  columns: Int32Array;

  /** Expanded A row ordinal for each stored coefficient. */
  rows: Int32Array;

  /** Equilibrated expanded A coefficients without thresholding. */
  values: Float64Array;

  /** Original interval row ordinal for every expanded row. */
  originalRows: Int32Array;

  /** Sign reconstructing each original interval multiplier. */
  signs: Float64Array;

  /** Cumulative positive variable scaling, initially identity. */
  d: Float64Array;

  /** Cumulative positive constraint-row scaling, initially identity. */
  e: Float64Array;

  /** Cumulative positive objective scaling, initially one. */
  c: number;

  /** Infinity norm of original q before equilibration. */
  normq: number;

  /** Infinity norm of expanded b before equilibration. */
  normb: number;
}
