import type { AutoMovieBernsteinPolynomial64 } from "./AutoMovieBernsteinPolynomial64";

/**
 * Three-component rational Bernstein field with one scalar homogeneous
 * denominator.
 *
 * Both fields use the same local parameter. Use finite controls and query
 * coordinates with representable quotient and derivative arithmetic.
 */
export interface IAutoMovieRationalBernsteinVector64 {
  /**
   * Mutable homogeneous XYZ Bernstein controls in one caller-defined frame,
   * ordered along the field parameter.
   */
  numerator: AutoMovieBernsteinPolynomial64;

  /**
   * Mutable scalar Bernstein coefficients on the same local parameter. Supply a
   * positive finite evaluated denominator.
   */
  denominator: number[];
}
