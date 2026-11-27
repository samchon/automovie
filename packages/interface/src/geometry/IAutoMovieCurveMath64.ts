import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Cubic coefficient and physical-chart endpoint records used by curve
 * arithmetic.
 */
export namespace IAutoMovieCurveMath64 {
  /**
   * One mutable cubic Bernstein record in P0, P1, P2, P3 order; the inner
   * coefficients are handles, not interpolated supports. All four triples use a
   * common caller-defined frame and coefficient unit; the tuple shape enforces
   * degree but not finiteness.
   */
  export type Span = [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ];

  /**
   * Endpoint Hermite data converted from four cubic Bernstein controls on a
   * positive finite chart width. Derivatives are dP/ds, not unit directions or
   * unit-parameter derivatives. Endpoints and derivatives own fresh triples.
   * The inverse is algebraic in real arithmetic; finite evaluation does not
   * promise bitwise round trips or recover handles already lost to rounding.
   * Nonfinite input, a noncubic net and unresolved binary64 derivatives throw.
   * Existing endpoint evaluation is tried first, then fixed equivalent quotient
   * orders for unresolved components. This is not an arbitrary-precision
   * guarantee for every mathematically representable derivative.
   */
  export type IToHermiteResult = {
    /** Fresh copy of P0 in the input coefficient frame and units. */
    start: AutoMovieVector3Tuple;

    /** Fresh copy of P3 in the input coefficient frame and units. */
    end: AutoMovieVector3Tuple;

    /**
     * Fresh dP/ds triple, algebraically 3*(P1-P0)/dy for supplied positive
     * chart width dy; not the derivative with respect to normalized span
     * fraction unless dy=1.
     */
    startDerivative: AutoMovieVector3Tuple;

    /**
     * Fresh dP/ds triple, algebraically 3*(P3-P2)/dy, with the same
     * length-per-chart-unit scaling as startDerivative.
     */
    endDerivative: AutoMovieVector3Tuple;
  };
}
