import type {
  IAutoMovieCurveLengthMeasurement64,
  IAutoMovieCurveLengthQuadrature64,
  IAutoMovieMeasureCurveLength64,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../math/overflowsBinary64";
import { AutoMovieCurveLengthQuadrature64 } from "./AutoMovieCurveLengthQuadrature64";

/**
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
 *
 * @param pieces Original derivative readers and finite increasing domains,
 *   nonempty.
 * @param subdivisions Equal panels per piece, an integer in [1,1024].
 * @returns Finer length and the absolute coarse/fine difference, both mm.
 * @throws Invalid data, nonfinite/underflowing arithmetic or collapsed nodes;
 *   callback exceptions propagate unchanged.
 */
export function measureAutoMovieCurveLength64(
  pieces: IAutoMovieMeasureCurveLength64.IPieces,
  subdivisions: number = 1,
): IAutoMovieCurveLengthMeasurement64 {
  admitSubdivisions(subdivisions);
  if (pieces.length === 0)
    throw new Error("Curve length needs an original piece");

  // Closed finite derivative charts are admitted before either numerical observation.
  for (const piece of pieces) admitDomain(piece.domain);
  const measured: IAutoMovieCurveLengthQuadrature64.IMeasureResult =
    AutoMovieCurveLengthQuadrature64.measure(pieces, subdivisions, true);
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
  if (![measured.coarseMm, measured.fineMm].every(Number.isFinite))
    throw new Error("Curve speed integration overflow");
  return {
    lengthMm: measured.fineMm,
    differenceMm: Math.abs(measured.fineMm - measured.coarseMm),
  };
}

/** Prepare the source addresses that the length measurement will read. */
export namespace measureAutoMovieCurveLength64 {
  /** Declare one fixed piece's endpoint and interior addresses before measuring. */
  export function parameters(
    domain: readonly [number, number],
    subdivisions: number,
  ): number[] {
    admitSubdivisions(subdivisions);
    admitDomain(domain);
    return AutoMovieCurveLengthQuadrature64.parameters(domain, subdivisions);
  }
}

function admitSubdivisions(subdivisions: number): void {
  if (
    !Number.isSafeInteger(subdivisions) ||
    subdivisions < 1 ||
    subdivisions > 1024
  )
    throw new Error("Curve length subdivisions must be an integer in [1,1024]");
}

function admitDomain([a, b]: readonly [number, number]): void {
  if (
    !(
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      b > a &&
      !overflowsBinary64(b - a)
    )
  )
    throw new Error(
      "Curve length needs finite increasing representable domains",
    );
}
