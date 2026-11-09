import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";
import { AutoMovieCurveLengthQuadrature64 } from "./AutoMovieCurveLengthQuadrature64";

/** Integrate a cubic curve's physical speed with composite eight-point
 * Gauss-Legendre quadrature. Controls use millimetres, so the returned length
 * uses millimetres independently of the curve's phase unit or piece widths.
 * Doubling the subdivisions supplies an observed difference, not an error bound.
 * The original interior-only finite-final policy remains: endpoint-only speed
 * overflow and underflowed contributions do not add admission failures here.
 *
 * @evidence contracts/common.md#principled-implementation Applies eight-point Gauss-Legendre to the norm of each original Bernstein derivative over equal local-parameter subintervals and reports a doubled-resolution difference.
 * @evidence contracts/common.md#clear-and-simple-design Supplies original Bernstein derivatives to one shared internal quadrature owner while retaining this public function's original admission and finite-final policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source points, topology, altered controls or fitted perimeter replace original cubic speed. Strict source-only endpoint/underflow observations do not narrow the legacy finite-final return contract.
 * @evidence contracts/common.md#meaningful-documentation States millimetre input/output, phase independence, fixed bounded work and the absence of an error certificate.
 * @evidence contracts/performance.md#efficient-algorithms N spans and K subdivisions retain 24*N*K interior derivative evaluations and zero endpoint reads; N temporary descriptors preserve original local-span arithmetic and accumulation order.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared internal quadrature owner supplies the unchanged module-constant nodes/weights; callers may reuse a result for immutable controls, with no cross-call cache here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary descriptors borrow controls only during the call; the two-scalar result retains no input and the shared owner retains only fixed quadrature constants.
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
  const measured: ReturnType<typeof AutoMovieCurveLengthQuadrature64.measure> = AutoMovieCurveLengthQuadrature64.measure(
    curve.spans.map(
      (
        p: C.Span,
      ): Parameters<typeof AutoMovieCurveLengthQuadrature64.measure>[0][number] => ({
        domain: [0, 1],
        derivative: (t: number): C.Vector => {
          const s: number = 1 - t;

          /** The unchanged original Bernstein derivative component in local t. */
          const component: (axis: number) => number = (axis: number): number =>
            3 *
            (s * s * (p[1][axis]! - p[0][axis]!) +
              2 * s * t * (p[2][axis]! - p[1][axis]!) +
              t * t * (p[3][axis]! - p[2][axis]!));
          return [component(0), component(1), component(2)];
        },
      }),
    ),
    subdivisions,
    false,
  );
  if (!Number.isFinite(measured.fineMm) || !Number.isFinite(measured.coarseMm))
    throw new Error("Cubic speed integration overflow");
  return { lengthMm: measured.fineMm, differenceMm: Math.abs(measured.fineMm - measured.coarseMm) };
}
