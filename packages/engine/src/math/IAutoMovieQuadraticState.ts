/**
 * One homogeneous quadratic iterate or Newton direction. Iterates have positive
 * tau/kappa and positive inequality s/z; equality s is zero and z is free.
 * Directions use the same storage without positivity restrictions.
 *
 * @evidence contracts/development/design.md#principled-representation The Goulart and Chen quadratic homogeneous embedding augments primal, slack and dual vectors with tau and kappa, allowing either an optimum or an infeasibility certificate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The same private vector record carries iterates and their linearized directions; the iteration owner distinguishes their roles.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry or fixture identifiers enter numerical state.
 * @evidence contracts/development/common.md#meaningful-documentation States scalar positivity, equality freedom and the distinction between iterates and directions.
 */
export interface IAutoMovieQuadraticState {
  /** Homogeneous primal coordinates. */
  x: Float64Array;

  /** Homogeneous constraint slacks, zero on equality rows. */
  s: Float64Array;

  /** Homogeneous conic duals, unrestricted on equality rows. */
  z: Float64Array;

  /** Primal homogenization scalar. */
  tau: number;

  /** Complementary homogeneous scalar. */
  kappa: number;
}
