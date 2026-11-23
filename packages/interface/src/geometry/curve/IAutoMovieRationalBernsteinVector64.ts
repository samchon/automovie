import type { AutoMovieBernsteinPolynomial64 } from "./AutoMovieBernsteinPolynomial64";

/**
 * A rational vector field N/Q; the denominator must remain positive on the
 * evaluated chart.
 */
export interface IAutoMovieRationalBernsteinVector64 {
  /** Homogeneous vector numerator coefficients. */
  numerator: AutoMovieBernsteinPolynomial64;

  /** Scalar denominator coefficients in the same parameter. */
  denominator: number[];
}
