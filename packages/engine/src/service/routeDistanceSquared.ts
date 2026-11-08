import {
  IAutoMovieServiceSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Squared distance from a point to a run's centre line, in square metres.
 *
 * Squared because every caller compares it against a squared radius, and taking
 * the root first would only add a rounding step to a comparison that does not
 * need one.
 * Fewer than two route points return infinity. Direct products assume finite
 * representable spans and residuals; extreme coordinate squares can overflow
 * or underflow and this query is not a certified separation bound.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Each closed-leg projection clamps its scalar parameter to zero through one, and minimizing squared residuals selects polyline distance; exact collapsed legs use their first point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Sleeve placement validation asks only a squared radius comparison, so this route reduction returns a scalar without materializing witnesses.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angular or length epsilon collapses a represented nonzero leg; unrepresentable arithmetic remains a documented limitation rather than an exact-distance claim.
 * @evidence contracts/development/common.md#meaningful-documentation States square metres, projection bounds, absent-span infinity and direct-product precision limitations.
 * @evidence contracts/development/implementation.md#efficient-algorithms One constant-size projection per leg costs O(R) time for R points with constant live arithmetic storage.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Different sleeve positions need different projections, and mutable authored routes have no retained distance cache here.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the minimum scalar is returned; no route copy, witness array or source point reference is retained.
 */
export const routeDistanceSquared: (
  segment: IAutoMovieServiceSegment,
  point: { x: number; y: number; z: number },
) => number = (
  segment: IAutoMovieServiceSegment,
  point: { x: number; y: number; z: number },
): number => {
  let best: number = Number.POSITIVE_INFINITY;
  for (let index: number = 0; index + 1 < segment.route.length; ++index) {
    const one: IAutoMovieVector3 = segment.route[index]!;
    const next: IAutoMovieVector3 = segment.route[index + 1]!;
    const dx: number = next.x - one.x;
    const dy: number = next.y - one.y;
    const dz: number = next.z - one.z;
    const lengthSquared: number = dx * dx + dy * dy + dz * dz;
    const t: number =
      lengthSquared === 0
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              ((point.x - one.x) * dx +
                (point.y - one.y) * dy +
                (point.z - one.z) * dz) /
                lengthSquared,
            ),
          );
    const ex: number = one.x + dx * t - point.x;
    const ey: number = one.y + dy * t - point.y;
    const ez: number = one.z + dz * t - point.z;
    best = Math.min(best, ex * ex + ey * ey + ez * ez);
  }
  return best;
};
