import type { IAutoMovieCurveDomain } from "./IAutoMovieCurveDomain";

/** Data and callback contracts shared by the MeasureCurveLength64 operations. */
export namespace IAutoMovieMeasureCurveLength64 {
  /**
   * Measure original three-dimensional source derivatives by composite
   * eight-point Gauss-Legendre quadrature, retaining each piece's parameter and
   * millimetres. The derivative is dP/dparameter in mm per parameter unit; its
   * domain supplies that parameter unit, so their product is mm. Pieces need
   * not share a chart. Callbacks are pure and finite on their closed domains,
   * including endpoints. The caller owns the original source, partition,
   * world-frame chain rule and any continuity, closure or anatomical
   * interpretation. Singular/improper endpoint derivatives are unsupported;
   * finite zero speed is permitted.
   *
   * The finer K*2 result and its absolute difference from K are observations,
   * not an error bound or automatic convergence/regularity certificate. Narrow
   * features can escape both rules, and errors of different pieces can cancel.
   * This uses the existing cubic-length rule (NIST DLMF 3.5(v)); finite inputs
   * also require representable widths, quadrature nodes and intermediate sums.
   */
  export type IPieces = readonly {
    /** Finite increasing bounds in this derivative's own parameter chart. */
    domain: IAutoMovieCurveDomain;
    /** Original world derivative in mm per domain-parameter unit. */
    derivative: (parameter: number) => readonly [number, number, number];
  }[];
}
