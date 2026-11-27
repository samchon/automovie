import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Limit a timed course's knot tangents so no moving cubic runs back along its
 * chord.
 *
 * For each moving interval with chord velocity c, alpha and beta are its end
 * tangents' projections on c over |c|^2, negative parts dropped. Fritsch and
 * Carlson's sufficient region for a monotone cubic Hermite (SIAM J Numer Anal
 * 17:238, 1980), 2 alpha + beta <= 3 and alpha + 2 beta <= 3, scales both
 * tangents by the largest factor that meets it. A knot shared by two intervals
 * takes the smaller scale. Without the limit, a cubic leaving a hold toward a
 * fast next knot dips backward before it goes on; within this region its
 * leading term out of the hold points along the chord, so the hold's facing is
 * the motion's.
 * Parameter times: The samples' seconds.
 * Parameter points: The samples' points.
 * Parameter held: Whether each interval holds still.
 * Parameter tangents: The knot tangents, metres per second, scaled in place.
 */
export function limitMonotoneTangents(
  times: readonly number[],
  points: readonly IAutoMovieVector3[],
  held: readonly boolean[],
  tangents: IAutoMovieVector3[],
): void {
  const limit: number[] = points.map((): number => 1);
  for (let i: number = 0; i + 1 < points.length; i++) {
    if (held[i]) continue;
    const c: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(points[i + 1]!, points[i]!),
      1 / (times[i + 1]! - times[i]!),
    );
    const squared: number = Vector3.dot(c, c);
    if (!(squared > 0)) continue;
    const alpha: number = Math.max(0, Vector3.dot(tangents[i]!, c) / squared);
    const beta: number = Math.max(
      0,
      Vector3.dot(tangents[i + 1]!, c) / squared,
    );
    const scale: number = Math.min(
      1,
      3 / (2 * alpha + beta),
      3 / (alpha + 2 * beta),
    );
    limit[i] = Math.min(limit[i]!, scale);
    limit[i + 1] = Math.min(limit[i + 1]!, scale);
  }
  limit.forEach((scale: number, i: number): void => {
    if (scale < 1) tangents[i] = Vector3.scale(tangents[i]!, scale);
  });
}
