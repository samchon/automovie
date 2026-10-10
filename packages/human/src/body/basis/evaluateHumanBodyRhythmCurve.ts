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
