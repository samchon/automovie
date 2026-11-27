import type {
  IAutoMovieServiceSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Squared distance from a point to a run's centre line, in square metres.
 *
 * Squared because every caller compares it against a squared radius, and taking
 * the root first would only add a rounding step to a comparison that does not
 * need one. Fewer than two route points return infinity. Direct products assume
 * finite representable spans and residuals; extreme coordinate squares can
 * overflow or underflow and this query is not a certified separation bound.
 */
export function routeDistanceSquared(
  segment: IAutoMovieServiceSegment,
  point: IAutoMovieVector3,
): number {
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
}
