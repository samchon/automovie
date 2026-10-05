/**
 * A declared piecewise-linear coordination curve at one source angle, degrees.
 *
 * The curve is zero at and below the first knot (the first ordinate is zero
 * and the first knot sits at or above the source's rest angle by admission, so
 * the curve is continuous there and the rest adds nothing), linear inside the
 * bracketing segment, and holds the last ordinate past the last knot.
 * Admission guarantees at least two knots strictly increasing in angle, so
 * every segment has a nonzero width.
 *
 * The nanodegree tolerance at the first knot absorbs the cone formula's float
 * error at a rest angle (`2 acos(cos 10)` lands above 20 by one ulp), so a
 * curve authored to start exactly at the rest elevation adds nothing at rest.
 * An angle on a knot reads that knot as the start of the next segment (a zero
 * offset, the knot's own ordinate) or as the held last ordinate, never as the
 * end of the segment before it, whose interpolation can round past the
 * ordinate by an ulp and turn one admitted on the range's end into one the
 * pose validator refuses. Scapulohumeral couplings and the pelvifemoral
 * rhythm both read their curves through this one owner.
 *
 * @evidence contracts/common.md#principled-implementation Piecewise-linear interpolation between strictly increasing knots, zero below the first and held past the last; the first-knot tolerance absorbs a documented one-ulp cone-formula error so the rest adds nothing.
 * @evidence contracts/common.md#clear-and-simple-design One evaluator shared by every declared coordination curve instead of a copy per coupling kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tolerance is a nanodegree float-error allowance at the first knot only, not a tuning of any curve.
 * @evidence contracts/common.md#meaningful-documentation States the three regions, the admission premises, the tolerance's reason and the knot reading rule.
 * @evidence contracts/modeling.md#parameter-channels Converts a driving joint angle into the declared coordination increment of the driven joint.
 * @evidence contracts/modeling.md#spatial-conventions Input and output are clinical degrees.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The evaluator reads a curve and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The evaluator builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The pose resolver and editor observe the coordinated pose.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The curve's source belongs to the basis declaration that supplies it.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission bounds the curve; the evaluator reads it.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The evaluator is not a caller input.
 * @author Samchon
 */
export function evaluateHumanBodyRhythmCurve(
  curve: [number, number][],
  angle: number,
): number {
  if (!(angle > curve[0][0] + 1e-9)) return 0;
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (angle < x1) return y0 + ((y1 - y0) * (angle - x0)) / (x1 - x0);
  }
  return curve[curve.length - 1][1];
}
