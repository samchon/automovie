import type {
  IAutoMovieCurveLengthMeasurement64,
  IAutoMovieCurveLengthQuadrature64,
  IAutoMovieMeasureCurveLength64,
} from "@automovie/interface";

import { AutoMovieEngineCurveLengthQuadrature64 } from "../../AutoMovieEngineCurveLengthQuadrature64";

/*
 * Measure original three-dimensional source derivatives by composite
 * eight-point Gauss-Legendre quadrature, retaining each piece's parameter and
 * millimetres. The derivative is dP/dparameter in mm per parameter unit; its
 * domain supplies that parameter unit, so their product is mm. Pieces need not
 * share a chart. Callbacks are pure and finite on their closed domains,
 * including endpoints. The caller owns the original source, partition,
 * world-frame chain rule and any continuity, closure or anatomical
 * interpretation. Singular/improper endpoint derivatives are unsupported;
 * finite zero speed is permitted.
 *
 * The finer K*2 result and its absolute difference from K are observations, not
 * an error bound or automatic convergence/regularity certificate. Narrow
 * features can escape both rules, and errors of different pieces can cancel.
 * This uses the existing cubic-length rule (NIST DLMF 3.5(v)); finite inputs
 * also require representable widths, quadrature nodes and intermediate sums.
 * Parameter pieces: Original derivative readers and finite increasing domains,
 * nonempty.
 * Parameter subdivisions: Equal panels per piece, an integer in [1,1024].
 * Returns: Finer length and the absolute coarse/fine difference, both mm.
 * Invalid data, nonfinite/underflowing arithmetic or collapsed nodes;
 * callback exceptions propagate unchanged.
 */
export function measureCurveLength64(
  pieces: IAutoMovieMeasureCurveLength64.IPieces,
  subdivisions: number = 1,
): IAutoMovieCurveLengthMeasurement64 {
  if (
    !Number.isSafeInteger(subdivisions) ||
    subdivisions < 1 ||
    subdivisions > 1024
  )
    throw new Error("Curve length subdivisions must be an integer in [1,1024]");
  if (pieces.length === 0)
    throw new Error("Curve length needs an original piece");

  // Closed finite derivative charts are admitted before either numerical observation.
  for (const piece of pieces) {
    if (!piece || !piece.domain || typeof piece.derivative !== "function")
      throw new Error("Curve length needs complete original derivative pieces");
    const {
      start: a,
      end: b,
    }: IAutoMovieMeasureCurveLength64.IPieces[number]["domain"] = piece.domain;
    if (
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      !(b > a) ||
      !Number.isFinite(b - a)
    )
      throw new Error(
        "Curve length needs finite increasing representable domains",
      );
  }
  const measured: IAutoMovieCurveLengthQuadrature64.IMeasureResult =
    AutoMovieEngineCurveLengthQuadrature64.measure(pieces, subdivisions, true);
  if (measured.nonfiniteDerivative)
    throw new Error(
      "Curve length needs finite original world derivatives and speed",
    );
  if (measured.collapsedNode)
    throw new Error(
      "Curve length quadrature nodes are not representable inside their panels",
    );
  if (measured.nonfiniteContribution || measured.underflowingContribution)
    throw new Error(
      "Curve speed integration contribution is not representable",
    );
  if (!Number.isFinite(measured.coarseMm) || !Number.isFinite(measured.fineMm))
    throw new Error("Curve speed integration overflow");
  return {
    lengthMm: measured.fineMm,
    differenceMm: Math.abs(measured.fineMm - measured.coarseMm),
  };
}
