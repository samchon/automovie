/**
 * One homogeneous quadratic iterate or Newton direction. Iterates have positive
 * tau/kappa and positive inequality s/z; equality s is zero and z is free.
 * Directions use the same storage without positivity restrictions.
 *
 * @evidence contracts/common.md#principled-implementation The Goulart and Chen quadratic homogeneous embedding augments primal, slack and dual vectors with tau and kappa, allowing either an optimum or an infeasibility certificate.
 * @evidence contracts/common.md#clear-and-simple-design The same private vector record carries iterates and their linearized directions; the iteration owner distinguishes their roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry or fixture identifiers enter numerical state.
 * @evidence contracts/common.md#meaningful-documentation States scalar positivity, equality freedom and the distinction between iterates and directions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A vector record whose numerical owners answer their operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One call owns each state and no state seeds another problem.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Vectors have n+2m doubles and belong to one synchronous solve; result extraction copies retained values.
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
