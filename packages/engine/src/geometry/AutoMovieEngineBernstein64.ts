import { AutoMovieEngineBernsteinAlgebra64 as A } from "./AutoMovieEngineBernsteinAlgebra64";
import { AutoMovieEngineBernsteinGrid64 as G } from "./AutoMovieEngineBernsteinGrid64";
import { AutoMovieEngineBernsteinRational64 as L } from "./AutoMovieEngineBernsteinRational64";
import { AutoMovieEngineBernsteinSubdivision64 as S } from "./AutoMovieEngineBernsteinSubdivision64";

/**
 * Preserves the existing binary64 Bernstein namespace while responsibility
 * owners implement its operations. All five structural types and twenty-five
 * function names remain available, including the thirteen subdivision, grid and
 * quotient functions previously implemented directly in this namespace.
 * Function values are direct aliases; their coefficients, domains, errors and
 * arithmetic are unchanged. Internal owners depend on the algebra
 * implementation rather than this facade, preventing import cycles.
 */
export namespace AutoMovieEngineBernstein64 {
  /**
   * Binomial coefficient for admitted integer indices 0<=k<=n; preserves the
   * algebra owner's multiplicative order.
   */
  export const choose: typeof A.choose = A.choose;

  /**
   * Scalar Bernstein value at the supplied local parameter; no parameter
   * clamping or degree replacement.
   */
  export const scalar: typeof A.scalar = A.scalar;

  /**
   * Vector Bernstein value at the supplied local parameter; returned
   * coordinates retain the coefficient units.
   */
  export const value: typeof A.value = A.value;

  /**
   * Vector derivative coefficients with the caller's chart scale; a constant
   * retains the original empty-net result.
   */
  export const tangent: typeof A.tangent = A.tangent;

  /**
   * Scalar derivative coefficients with the caller's chart scale; a constant
   * yields the original zero constant.
   */
  export const dScalar: typeof A.dScalar = A.dScalar;

  /**
   * Raises scalar degree without changing the polynomial; a requested degree
   * reduction rejects.
   */
  export const elevateScalar: typeof A.elevateScalar = A.elevateScalar;

  /**
   * Raises all three vector coordinates to one Bernstein degree without
   * fitting.
   */
  export const elevate: typeof A.elevate = A.elevate;

  /**
   * Scalar Bernstein product using the original binomial-weighted coefficient
   * convolution.
   */
  export const product: typeof A.product = A.product;

  /**
   * Scalar-by-vector Bernstein product, retaining every coordinate and the
   * resulting degree.
   */
  export const productV: typeof A.productV = A.productV;

  /**
   * Vector polynomial sum after exact algebraic degree elevation, with the
   * original optional factor.
   */
  export const add: typeof A.add = A.add;

  /**
   * Scalar polynomial sum after degree elevation, with the original optional
   * factor.
   */
  export const addS: typeof A.addS = A.addS;

  /** Multiplies each vector coefficient by one scalar without changing degree. */
  export const scale: typeof A.scale = A.scale;

  /**
   * Two De Casteljau restrictions at the supplied local parameter, retaining
   * both child coefficient nets.
   */
  export const split: typeof S.split = S.split;

  /** Scalar restrictions from the same vector De Casteljau arithmetic path. */
  export const splitS: typeof S.splitS = S.splitS;

  /**
   * Vector polynomial restricted to ordered local endpoints inside [0,1];
   * invalid endpoints reject.
   */
  export const restrict: typeof S.restrict = S.restrict;

  /**
   * Scalar polynomial restricted to the same ordered local interval as the
   * vector operation.
   */
  export const restrictS: typeof S.restrictS = S.restrictS;

  /**
   * Three vector restrictions covering equal parameter thirds; they need not
   * have equal physical arc length.
   */
  export const thirds: typeof S.thirds = S.thirds;

  /** Three scalar restrictions covering the same equal parameter thirds. */
  export const thirdsS: typeof S.thirdsS = S.thirdsS;

  /**
   * Four longitudinal Bernstein rows from endpoint courses and complete
   * physical-chart derivatives.
   */
  export const hermite: typeof G.hermite = G.hermite;

  /**
   * Evaluates the outer grid parameter while retaining the complete inner
   * polynomial coefficients.
   */
  export const gridValue: typeof G.gridValue = G.gridValue;

  /** Outer-parameter derivative grid with the caller's chart scale. */
  export const gridTangent: typeof G.gridTangent = G.gridTangent;

  /**
   * Legacy aligned thirds of homogeneous vector numerator and scalar
   * denominator.
   */
  export const thirdsR: typeof L.thirdsR = L.thirdsR;

  /**
   * Legacy vector quotient value or derivative; a nonpositive evaluated
   * denominator rejects.
   */
  export const evaluateR: typeof L.evaluateR = L.evaluateR;

  /**
   * Legacy scalar quotient value or derivative; a nonpositive evaluated
   * denominator rejects.
   */
  export const evaluateS: typeof L.evaluateS = L.evaluateS;

  /**
   * Legacy control-positive rational scalar transition preserving its endpoint
   * values and slopes.
   */
  export const positiveScalar: typeof L.positiveScalar = L.positiveScalar;
}
