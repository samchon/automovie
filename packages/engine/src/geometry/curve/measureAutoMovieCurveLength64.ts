import { AutoMovieCurveLengthQuadrature64 } from "./AutoMovieCurveLengthQuadrature64";

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
 *
 * @param pieces Original derivative readers and finite increasing domains, nonempty.
 * @param subdivisions Equal panels per piece, an integer in [1,1024].
 * @returns Finer length and the absolute coarse/fine difference, both mm.
 * @throws Invalid data, nonfinite/underflowing arithmetic or collapsed nodes; callback exceptions propagate unchanged.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Integrates the Euclidean norm of each original world derivative on its actual finite parameter domain with the existing eight-point Gauss-Legendre nodes, weights and K/2K comparison.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This public owner admits source domains and interprets results from AutoMovieCurveLengthQuadrature64.measure; original curve producers supply derivatives instead of fitting a substitute cubic or exposing a general scalar integrator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires finite closed-domain derivatives and representable nodes/contributions, permits finite zero speed, and propagates callback failures. It neither clamps source queries nor treats the observed difference as a bound or medical/geometric proof.
 * @evidence contracts/development/common.md#meaningful-documentation States derivative/domain units, pure-callback/source ownership, piece-chart independence, finite endpoint admission, K limits, numerical failure and the observation-only result.
 * @evidence contracts/development/implementation.md#efficient-algorithms N pieces and K subdivisions use at most 24*N*K interior derivative reads plus 2*N endpoint checks; K is at most 1024 and all other scratch is constant-size, excluding callback work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Module-constant nodes/weights serve both rules and the existing cubic wrapper; endpoint admission and the coarse/fine observations are distinct reads with no cross-call cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows pieces/callbacks synchronously, retains only fixed 16 quadrature constants globally, and returns two scalars; no source reference, queue or task survives a call or exception.
 */
export function measureAutoMovieCurveLength64(
  pieces: readonly {
    /** Finite increasing bounds in this derivative's own parameter chart. */
    domain: readonly [number, number];
    /** Original world derivative in mm per domain-parameter unit. */
    derivative: (parameter: number) => readonly [number, number, number];
  }[],
  subdivisions: number = 1,
): {
  /** K*2-panel integral of original physical speed, mm. */
  lengthMm: number;
  /** Absolute K/K*2 difference, mm; not a bound. */
  differenceMm: number;
} {
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
    const [a, b]: readonly [number, number] = piece.domain;
    if (
      !(
        Number.isFinite(a) &&
        Number.isFinite(b) &&
        b > a &&
        Number.isFinite(b - a)
      )
    )
      throw new Error(
        "Curve length needs finite increasing representable domains",
      );
  }
  const measured: ReturnType<typeof AutoMovieCurveLengthQuadrature64.measure> =
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
