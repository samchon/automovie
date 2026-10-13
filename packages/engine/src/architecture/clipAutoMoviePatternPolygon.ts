import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * Clip one convex face-local polygon by another, keeping what lies inside.
 *
 * The clipper is read as a counter-clockwise convex outline, as the pattern
 * run canonicalizes every region and exclusion, and the subject is cut by each
 * of its edges in turn. The answer is the intersection as a new outline in the
 * subject's winding, or an empty list when the two share no area.
 *
 * A crossing is only cut where the corner it crosses to actually leaves the
 * line. A corner sitting exactly on a clip edge already is the intersection,
 * so emitting one for it would put the same point in the outline twice, and a
 * repeated point makes a zero-length edge whose normal is undefined. That
 * outline still measures the right area, which is what makes the fault quiet:
 * the joint measurement between two pieces would divide by that zero, and every
 * comparison against the resulting `NaN` reads false, so the pair would pass
 * the joint and overlap tests by never being judged at all.
 *
 * @param subject Convex outline to clip, in face-local metres.
 * @param clipper Counter-clockwise convex outline to clip by.
 * @returns The part of `subject` inside `clipper`, possibly empty.
 *
 * @evidence contracts/common.md#principled-implementation Sutherland and Hodgman half-plane clipping, exact for a convex clipper: each clipper edge keeps the subject corners on its inner side and inserts the edge's crossing point by linear interpolation of the signed side values; the premise is a counter-clockwise convex clipper, which the pattern run guarantees by canonicalizing through a convex hull.
 * @evidence contracts/common.md#clear-and-simple-design One clipper with two private helpers, used by the pattern run for zone overlap, region clipping and exclusion area, so every area in a take-off is cut the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no outline; the on-line corner rule is the algorithm's correct treatment of a vertex on the clip line, not a guard for one measured case.
 * @evidence contracts/common.md#meaningful-documentation States the clipper's required winding and convexity, what is returned and when it is empty, and why an on-line corner emits no extra crossing.
 * @evidence contracts/performance.md#efficient-algorithms O(n·m) for an n-corner subject and m-edge clipper, the cost of Sutherland and Hodgman, with early exit once the outline is empty; pattern outlines are a handful of corners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of two outlines that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one working outline per clipper edge and retains nothing; the caller owns the returned outline.
 */
export const clipAutoMoviePatternPolygon = (
  subject: readonly IAutoMoviePatternPoint[],
  clipper: readonly IAutoMoviePatternPoint[],
): IAutoMoviePatternPoint[] => {
  let output: IAutoMoviePatternPoint[] = [...subject];
  for (
    let index: number = 0;
    index < clipper.length && output.length > 0;
    ++index
  ) {
    const from: IAutoMoviePatternPoint = clipper[index]!;
    const to: IAutoMoviePatternPoint = clipper[(index + 1) % clipper.length]!;
    const input: IAutoMoviePatternPoint[] = output;
    output = [];
    for (let corner: number = 0; corner < input.length; ++corner) {
      const current: IAutoMoviePatternPoint = input[corner]!;
      const previous: IAutoMoviePatternPoint =
        input[(corner + input.length - 1) % input.length]!;
      const currentSide: number = side(from, to, current);
      const previousSide: number = side(from, to, previous);
      if (currentSide >= 0) {
        if (previousSide < 0 && currentSide > 0)
          output.push(intersect(previous, current, from, to));
        output.push(current);
      } else if (previousSide > 0)
        output.push(intersect(previous, current, from, to));
    }
  }
  return output;
};

/** Twice the signed area of `from`, `to`, `point`; positive on the left. */
const side = (
  from: IAutoMoviePatternPoint,
  to: IAutoMoviePatternPoint,
  point: IAutoMoviePatternPoint,
): number =>
  (to.u - from.u) * (point.v - from.v) - (to.v - from.v) * (point.u - from.u);

/** Where segment `from`-`to` crosses the line through `edgeFrom`-`edgeTo`. */
const intersect = (
  from: IAutoMoviePatternPoint,
  to: IAutoMoviePatternPoint,
  edgeFrom: IAutoMoviePatternPoint,
  edgeTo: IAutoMoviePatternPoint,
): IAutoMoviePatternPoint => {
  const a: number = side(edgeFrom, edgeTo, from);
  const b: number = side(edgeFrom, edgeTo, to);
  const ratio: number = a / (a - b);
  return {
    u: from.u + (to.u - from.u) * ratio,
    v: from.v + (to.v - from.v) * ratio,
  };
};
