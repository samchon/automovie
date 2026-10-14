/**
 * A declared piecewise-linear coordination curve at one source angle, degrees.
 *
 * The initial branch returns zero unless the angle exceeds the first knot plus 1e-9 degrees; this also returns zero for a NaN query, rather than admitting that query. Above that threshold, the curve is linear inside the bracketing segment and holds its last ordinate past the last knot. Admission guarantees at least two finite knots strictly increasing in angle, so every segment has a nonzero width. The start allowance takes precedence over any other knot inside it and need not join the subsequent interpolation continuously.
 *
 * The nanodegree allowance at the first knot absorbs the cone formula's float error at a declared rest angle (`2 acos(cos 10)` lands above 20 by one ulp). A shaped shoulder rest can exceed this region. Beyond the initial branch, an angle on a knot reads that knot as the start of the next segment (a zero offset, the knot's own ordinate) or as the held last ordinate, never as the end of the previous segment, whose interpolation can round past the ordinate by an ulp and turn one admitted on the range's end into one the pose validator refuses. Scapulohumeral couplings and the pelvifemoral rhythm both read their curves through this one owner.
 *
 * @evidence contracts/common.md#principled-implementation Under prior finite ordered zero-first-ordinate knot admission, a first-knot-plus-1e-9 zero branch precedes linear bracketing and terminal hold for one shared degree coordination curve.
 * @evidence contracts/common.md#clear-and-simple-design Scapular and pelvic scalar coordination share one piecewise-linear owner with identical knot-boundary behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-9-degree start allowance addresses rest-cone rounding, not clinical range relaxation; exact knots avoid previous-segment overshoot.
 * @evidence contracts/common.md#meaningful-documentation The prose gives admitted curve premises, exact start-branch precedence, NaN behavior, shaped-rest limits and terminal/knot-rounding behavior in degrees.
 * @evidence contracts/performance.md#efficient-algorithms A first-bracketing linear scan costs O(K) curve knots and O(1) extra state, appropriate to the small authored coordination curves.
 * @evidence contracts/performance.md#reuse-equivalent-work Both coordination consumers share this function, while different source angles require their own scalar evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar bracket values are local and no curve copy, interpolation cache or running task is retained.
 * @author Samchon
 */
export function evaluateHumanBodyRhythmCurve(
  curve: [number, number][],
  angle: number,
): number {
  if (!(angle > curve[0][0] + 1e-9)) return 0;
  for (let i: number = 1; i < curve.length; i++) {
    const [x0, y0]: [number, number] = curve[i - 1];
    const [x1, y1]: [number, number] = curve[i];
    if (angle < x1) return y0 + ((y1 - y0) * (angle - x0)) / (x1 - x0);
  }
  return curve[curve.length - 1][1];
}
