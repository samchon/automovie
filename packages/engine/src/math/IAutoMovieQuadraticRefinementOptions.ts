/**
 * Original-coordinate stopping criteria and finite work for QP correction.
 * Numerical convergence does not establish the consuming geometry's validity.
 *
 * @author Samchon
 */
export interface IAutoMovieQuadraticRefinementOptions {
  /** Positive finite threshold for original feasibility, stationarity and complementarity. */
  tolerance: number;

  /** Nonnegative safe integer bounding original-coordinate polishing corrections. */
  maximumRefinements: number;
}
