import type { IAutoMovieConicFieldJet } from "@automovie/interface";

/**
 * Scalar source partials for the shared numeric and differentiated conic
 * algebra.
 *
 * The two coordinates are source parameters s and p, never a native curve
 * clock. Entries are derivatives rather than Taylor coefficients. Geometry
 * owners admit inputs and finite outputs; these operations propagate IEEE
 * nonfinite arithmetic.
 */
export namespace AutoMovieConicFieldJet {
  /**
   * Ordinary scalar specialization; its arithmetic has the existing Math
   * semantics.
   */
  export const NUMBER: IAutoMovieConicFieldJet.IAlgebra<number> = {
    /** Identity primal reading. */
    value: (input: number): number => input,

    /** Coordinate-independent numeric scalar. */
    constant: (value: number): number => value,

    /** Numeric sum. */
    add: (a: number, b: number): number => a + b,

    /** Numeric difference. */
    subtract: (a: number, b: number): number => a - b,

    /** Numeric product. */
    multiply: (a: number, b: number): number => a * b,

    /** Numeric quotient. */
    divide: (a: number, b: number): number => a / b,

    /** Numeric square root. */
    sqrt: Math.sqrt,

    /** Numeric cube root. */
    cbrt: Math.cbrt,

    /** Numeric natural logarithm. */
    log: Math.log,

    /** Numeric exponential. */
    exp: Math.exp,
  };

  /** Source-partial specialization; each arithmetic result is a fresh tuple. */
  export const AD: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
    {
      /** Primal value without changing derivative data. */
      value: (input: IAutoMovieConicFieldJet.IJet): number => input[0],

      /** A declared constant in both source coordinates. */
      constant: (value: number): IAutoMovieConicFieldJet.IJet => [
        value,
        0,
        0,
        0,
        0,
        0,
      ],

      /** Componentwise sum. */
      add: (
        a: IAutoMovieConicFieldJet.IJet,
        b: IAutoMovieConicFieldJet.IJet,
      ): IAutoMovieConicFieldJet.IJet => [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2],
        a[3] + b[3],
        a[4] + b[4],
        a[5] + b[5],
      ],

      /** Componentwise difference. */
      subtract: (
        a: IAutoMovieConicFieldJet.IJet,
        b: IAutoMovieConicFieldJet.IJet,
      ): IAutoMovieConicFieldJet.IJet => [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2],
        a[3] - b[3],
        a[4] - b[4],
        a[5] - b[5],
      ],

      /** Full product rule. */
      multiply,

      /** Quotient recurrence using already computed first partials. */
      divide,

      /** Differentiate y squared equals input. */
      sqrt,

      /** Differentiate y cubed equals input. */
      cbrt,

      /** Logarithmic first and second partials. */
      log,

      /** Exponential partials with reused scaled first derivatives. */
      exp,
    };

  /**
   * Lift a regular station scalar [value,ds,dss] while p is a declared
   * constant.
   */
  export function fromStation(
    input: readonly [number, number, number],
  ): IAutoMovieConicFieldJet.IJet {
    return [input[0], input[1], 0, input[2], 0, 0];
  }
}

/*
 * Full two-variable product rule, with actual Hessian rather than Taylor
 * entries.
 */
function multiply(
  a: IAutoMovieConicFieldJet.IJet,
  b: IAutoMovieConicFieldJet.IJet,
): IAutoMovieConicFieldJet.IJet {
  return [
    a[0] * b[0],
    a[1] * b[0] + a[0] * b[1],
    a[2] * b[0] + a[0] * b[2],
    a[3] * b[0] + 2 * a[1] * b[1] + a[0] * b[3],
    a[4] * b[0] + a[1] * b[2] + a[2] * b[1] + a[0] * b[4],
    a[5] * b[0] + 2 * a[2] * b[2] + a[0] * b[5],
  ];
}

/*
 * Differentiate a=q*b, avoiding separately materialized reciprocal powers.
 */
function divide(
  a: IAutoMovieConicFieldJet.IJet,
  b: IAutoMovieConicFieldJet.IJet,
): IAutoMovieConicFieldJet.IJet {
  const value: number = a[0] / b[0];
  const s: number = (a[1] - value * b[1]) / b[0];
  const p: number = (a[2] - value * b[2]) / b[0];
  return [
    value,
    s,
    p,
    (a[3] - 2 * s * b[1] - value * b[3]) / b[0],
    (a[4] - s * b[2] - p * b[1] - value * b[4]) / b[0],
    (a[5] - 2 * p * b[2] - value * b[5]) / b[0],
  ];
}

/*
 * Implicit square-root recurrence avoids inverse powers of a tiny input value.
 */
function sqrt(a: IAutoMovieConicFieldJet.IJet): IAutoMovieConicFieldJet.IJet {
  const value: number = Math.sqrt(a[0]);
  const s: number = a[1] / (2 * value);
  const p: number = a[2] / (2 * value);
  return [
    value,
    s,
    p,
    a[3] / (2 * value) - (s / value) * s,
    a[4] / (2 * value) - (s / value) * p,
    a[5] / (2 * value) - (p / value) * p,
  ];
}

/*
 * Differentiate y cubed equals a using representable root powers and first
 * jets.
 */
function cbrt(a: IAutoMovieConicFieldJet.IJet): IAutoMovieConicFieldJet.IJet {
  const value: number = Math.cbrt(a[0]);
  const square: number = value * value;
  const s: number = a[1] / (3 * square);
  const p: number = a[2] / (3 * square);
  return [
    value,
    s,
    p,
    a[3] / (3 * square) - 2 * (s / value) * s,
    a[4] / (3 * square) - 2 * (s / value) * p,
    a[5] / (3 * square) - 2 * (p / value) * p,
  ];
}

/*
 * Log Hessian is the normalized input Hessian minus its gradient outer product.
 */
function log(a: IAutoMovieConicFieldJet.IJet): IAutoMovieConicFieldJet.IJet {
  const s: number = a[1] / a[0];
  const p: number = a[2] / a[0];
  return [
    Math.log(a[0]),
    s,
    p,
    a[3] / a[0] - s * s,
    a[4] / a[0] - s * p,
    a[5] / a[0] - p * p,
  ];
}

/*
 * Reuse exp(a)*a_i before multiplying again in the Hessian's outer product.
 */
function exp(a: IAutoMovieConicFieldJet.IJet): IAutoMovieConicFieldJet.IJet {
  const value: number = Math.exp(a[0]);
  const s: number = value * a[1];
  const p: number = value * a[2];
  return [
    value,
    s,
    p,
    value * a[3] + s * a[1],
    value * a[4] + s * a[2],
    value * a[5] + p * a[2],
  ];
}
