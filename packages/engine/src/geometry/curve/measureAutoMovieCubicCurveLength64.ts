import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";

/** Integrate a cubic curve's physical speed with composite eight-point
 * Gauss-Legendre quadrature. Controls use millimetres, so the returned length
 * uses millimetres independently of the curve's phase unit or piece widths.
 * Doubling the subdivisions supplies an observed difference, not an error bound.
 *
 * @evidence contracts/common.md#principled-implementation Applies eight-point Gauss-Legendre to the norm of each original Bernstein derivative over equal local-parameter subintervals and reports a doubled-resolution difference.
 * @evidence contracts/common.md#clear-and-simple-design One stateless curve measurement owns quadrature; callers own physical constraints and inversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source points, topology, identity, anatomical convention, altered controls or fitted perimeter replace the original cubic speed.
 * @evidence contracts/common.md#meaningful-documentation States millimetre input/output, phase independence, fixed bounded work and the absence of an error certificate.
 * @evidence contracts/performance.md#efficient-algorithms N spans and K subdivisions take 24*N*K derivative evaluations and constant additional storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pure measurement owns no cross-call cache; callers can reuse a returned result for immutable controls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two scalar accumulators and fixed quadrature constants survive inside the call; the scalar result retains no input.
 */
export function measureAutoMovieCubicCurveLength64(
  curve: C.Cubic,
  subdivisions: number = 1,
): {
  /** Doubled-resolution integral of physical speed, mm. */
  lengthMm: number;
  /** Absolute difference between the two quadratures, mm; not a bound. */
  differenceMm: number;
} {
  assertAutoMovieCurve64(curve);
  if (
    !Number.isSafeInteger(subdivisions) ||
    subdivisions < 1 ||
    subdivisions > 1024
  )
    throw new Error("Cubic length subdivisions must be an integer in [1,1024]");
  const nodes: readonly number[] = [
    -0.9602898564975363, -0.7966664774136267, -0.525532409916329,
    -0.1834346424956498, 0.1834346424956498, 0.525532409916329,
    0.7966664774136267, 0.9602898564975363,
  ];
  const weights: readonly number[] = [
    0.1012285362903763, 0.2223810344533745, 0.3137066458778873,
    0.362683783378362, 0.362683783378362, 0.3137066458778873,
    0.2223810344533745, 0.1012285362903763,
  ];
  const coarse: number = integral(subdivisions);
  const fine: number = integral(2 * subdivisions);
  if (!Number.isFinite(fine) || !Number.isFinite(coarse))
    throw new Error("Cubic speed integration overflow");
  return { lengthMm: fine, differenceMm: Math.abs(fine - coarse) };

  /** Integrate local t speed so original parameter scaling cancels exactly in the equation. */
  function integral(count: number): number {
    let length: number = 0;
    for (const p of curve.spans)
      for (let interval: number = 0; interval < count; ++interval)
        for (let i: number = 0; i < nodes.length; ++i) {
          const t: number = (interval + (nodes[i]! + 1) / 2) / count;
          const s: number = 1 - t;
          const components: number[] = [0, 1, 2].map(
            (axis: number): number =>
              3 *
              (s * s * (p[1][axis]! - p[0][axis]!) +
                2 * s * t * (p[2][axis]! - p[1][axis]!) +
                t * t * (p[3][axis]! - p[2][axis]!)),
          );
          length += (weights[i]! * Math.hypot(...components)) / (2 * count);
        }
    return length;
  }
}
