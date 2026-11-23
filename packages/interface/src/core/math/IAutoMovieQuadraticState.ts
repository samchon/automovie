/**
 * One homogeneous quadratic iterate or Newton direction. Iterates have positive
 * tau/kappa and positive inequality s/z; equality s is zero and z is free.
 * Directions use the same storage without positivity restrictions.
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
