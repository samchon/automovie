import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Project a point onto the nearest edge of an admitted nonempty closed polyline in one metre frame. Clamp the edge coordinate to [0,1], use zero fraction for a zero-length edge, and keep the first edge on equal distance. Caller supplies finite representable geometry; squared-length arithmetic is not independently guarded. Empty input retains the initial edge=0/fraction=0 placeholder, so the nonempty premise is required for a meaningful projection.
 *
 * @evidence contracts/common.md#principled-implementation Actual source segments and Euclidean distances determine the nearest convex edge coordinate used by seam compilation and face collar weights.
 * @evidence contracts/common.md#clear-and-simple-design One segment scan reports only edge/fraction; cyclic order admission and skin interpolation remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact ties keep first-edge ownership, zero edges use their endpoint, and projection is not claimed cyclic ordering, finite admission, anatomical validity or current visual observation.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, dimensionless fraction, admitted nonempty/finite premises and actual empty/zero-edge behavior.
 * @evidence contracts/performance.md#efficient-algorithms E loop edges perform fixed vector/projection/distance work in O(E), with one best candidate rather than an allocated sorted distance population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each point/polyline pair is projected afresh; no spatial index, source projection cache or request coordinator is implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fixed candidate records and the scalar result retain no polyline, callback, task or external resource.
 */
export function projectHumanLoopPoint(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
): { edge: number; fraction: number } {
  let best: { edge: number; fraction: number; distance: number } = {
    edge: 0,
    fraction: 0,
    distance: Infinity,
  };
  for (let edge: number = 0; edge < points.length; edge++) {
    const a: IAutoMovieVector3 = points[edge];
    const b: IAutoMovieVector3 = points[(edge + 1) % points.length];
    const along: IAutoMovieVector3 = {
      x: b.x - a.x,
      y: b.y - a.y,
      z: b.z - a.z,
    };
    const length: number =
      along.x * along.x + along.y * along.y + along.z * along.z;
    const raw: number =
      length === 0
        ? 0
        : ((p.x - a.x) * along.x +
            (p.y - a.y) * along.y +
            (p.z - a.z) * along.z) /
          length;
    const fraction: number = Math.min(1, Math.max(0, raw));
    const distance: number = Math.hypot(
      p.x - (a.x + along.x * fraction),
      p.y - (a.y + along.y * fraction),
      p.z - (a.z + along.z * fraction),
    );
    if (distance < best.distance) best = { edge, fraction, distance };
  }
  return { edge: best.edge, fraction: best.fraction };
}
