import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Cubic coefficient and physical-chart endpoint records used by curve arithmetic.
 *
 * @evidence contracts/development/design.md#principled-representation Four Bernstein controls encode one cubic; Hermite endpoint derivatives scale by the caller's physical chart width.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Curve arithmetic and recovery conversion share coefficient order and endpoint reconstruction data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Handle coefficients remain distinct from interpolation samples and derivatives retain their physical magnitude.
 * @evidence contracts/development/common.md#meaningful-documentation Span and IToHermiteResult define coefficient order, units, ownership and finite-round-trip limitations.
 */
export namespace IAutoMovieCurveMath64 {
  /**
     * One mutable cubic Bernstein record in P0, P1, P2, P3 order; the inner coefficients are handles, not interpolated supports. All four triples use a common caller-defined frame and coefficient unit; the tuple shape enforces degree but not finiteness.
     *
     * @evidence contracts/development/design.md#principled-representation Four ordered vectors enforce a cubic Bernstein coefficient net; frame, coefficient units and finite-value admission belong to the consuming operation.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One tuple records endpoint and handle order for all cubic helpers.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Handles remain coefficients rather than interpolation samples.
     * @evidence contracts/development/common.md#meaningful-documentation P0/P1/P2/P3 order is stated independently of the enclosing coordinate units.
     */
    export type Span = [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];

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
   *
   * @evidence contracts/development/design.md#principled-representation Endpoint positions retain the input frame and length unit; derivatives divide that unit by the supplied chart-width unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieCurveMath64.toHermite returns exactly the endpoint data consumed by Hermite reconstruction and recovery curve conversion.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derivatives retain magnitude and zero values instead of becoming unit tangents; the converter rejects unresolved arithmetic.
   * @evidence contracts/development/common.md#meaningful-documentation States endpoint ownership, derivative scaling, admission and finite-round-trip limits.
   */
  export type IToHermiteResult = {
    /** Fresh copy of P0 in the input coefficient frame and units. */
    start: AutoMovieVector3Tuple;

    /** Fresh copy of P3 in the input coefficient frame and units. */
    end: AutoMovieVector3Tuple;

    /** Fresh dP/ds triple, algebraically 3*(P1-P0)/dy for supplied positive chart width dy; not the derivative with respect to normalized span fraction unless dy=1. */
    startDerivative: AutoMovieVector3Tuple;

    /** Fresh dP/ds triple, algebraically 3*(P3-P2)/dy, with the same length-per-chart-unit scaling as startDerivative. */
    endDerivative: AutoMovieVector3Tuple;
  };
}
