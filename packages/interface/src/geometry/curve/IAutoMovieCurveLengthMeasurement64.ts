

/**
 * Measure original three-dimensional source derivatives by composite eight-point
 * Gauss-Legendre quadrature, retaining each piece's parameter and millimetres.
 * The derivative is dP/dparameter in mm per parameter unit; its domain supplies
 * that parameter unit, so their product is mm. Pieces need not share a chart.
 * Callbacks are pure and finite on their closed domains, including endpoints.
 * The caller owns the original source, partition, world-frame chain rule and
 * any continuity, closure or anatomical interpretation. Singular/improper
 * endpoint derivatives are unsupported; finite zero speed is permitted.
 * 
 * The finer K*2 result and its absolute difference from K are observations,
 * not an error bound or automatic convergence/regularity certificate. Narrow
 * features can escape both rules, and errors of different pieces can cancel.
 * This uses the existing cubic-length rule (NIST DLMF 3.5(v)); finite inputs
 * also require representable widths, quadrature nodes and intermediate sums.
 */
export type IAutoMovieCurveLengthMeasurement64 = {
  /** K*2-panel integral of original physical speed, mm. */
  lengthMm: number;
  /** Absolute K/K*2 difference, mm; not a bound. */
  differenceMm: number;
};
