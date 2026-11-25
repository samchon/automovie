/** Data and callback contracts shared by the ConicFieldJet operations. */
export namespace IAutoMovieConicFieldJet {
  /**
   * Value and source partials [value,s,p,ss,sp,pp], in each supplied
   * coordinate's units.
   */
  export type IJet = readonly [number, number, number, number, number, number];

  /** Operations needed by one shared conic preparation formula. */
  export interface IAlgebra<T> {
    /** Primal value used for numerical scaling and declared branch selection. */
    value(input: T): number;

    /** A coordinate-independent scalar, with zero source partials. */
    constant(value: number): T;

    /** Scalar addition and corresponding source partials. */
    add(a: T, b: T): T;

    /** Scalar subtraction and corresponding source partials. */
    subtract(a: T, b: T): T;

    /** Product with both first partials and the symmetric Hessian. */
    multiply(a: T, b: T): T;

    /** Quotient; the geometry owner requires an admitted nonzero divisor. */
    divide(a: T, b: T): T;

    /** Positive square root and its source partials on its regular domain. */
    sqrt(input: T): T;

    /** Real cube root and source partials away from its singular zero. */
    cbrt(input: T): T;

    /** Natural logarithm and source partials on its positive domain. */
    log(input: T): T;

    /** Exponential and its source partials, subject to finite arithmetic. */
    exp(input: T): T;
  }
}
