import { IAutoMovieServiceSegment } from "@automovie/interface";

/**
 * Squared distance from a point to a run's centre line, in square metres.
 *
 * Squared because every caller compares it against a squared radius, and taking
 * the root first would only add a rounding step to a comparison that does not
 * need one.
 */
export const routeDistanceSquared = (
  segment: IAutoMovieServiceSegment,
  point: { x: number; y: number; z: number },
): number => {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index + 1 < segment.route.length; ++index) {
    const one = segment.route[index]!;
    const next = segment.route[index + 1]!;
    const dx = next.x - one.x;
    const dy = next.y - one.y;
    const dz = next.z - one.z;
    const lengthSquared = dx * dx + dy * dy + dz * dz;
    const t =
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
    const ex = one.x + dx * t - point.x;
    const ey = one.y + dy * t - point.y;
    const ez = one.z + dz * t - point.z;
    best = Math.min(best, ex * ex + ey * ey + ez * ez);
  }
  return best;
};
