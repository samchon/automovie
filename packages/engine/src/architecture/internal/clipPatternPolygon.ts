import type { IAutoMoviePatternPoint } from "@automovie/interface";

import { intersectConvexPolygons } from "../../geometry/internal/intersectConvexPolygons";

/*
 * Clip a convex face-local pattern outline by its canonical counter-clockwise
 * boundary.
 *
 * Pattern coordinates remain face-local metres; this adapter changes their
 * record shape only. The shared Sutherland-Hodgman operation retains subject
 * winding and previous/current traversal order. Strict crossings avoid
 * duplicate corners on an edge. Disjoint inputs yield an empty list; point or
 * line contact can yield a zero-area outline. Finite convex well-scaled
 * coordinates remain caller premises without directed rounding or independent
 * convexity validation here.
 * Parameter subject: Convex outline to clip, in face-local metres.
 * Parameter clipper: Counter-clockwise convex outline in the same frame and unit.
 * Returns: Newly allocated intersection records, possibly empty or zero-area.
 */
export function clipPatternPolygon(
  subject: readonly IAutoMoviePatternPoint[],
  clipper: readonly IAutoMoviePatternPoint[],
): IAutoMoviePatternPoint[] {
  return intersectConvexPolygons(
    subject.map((point: IAutoMoviePatternPoint): [number, number] => [
      point.u,
      point.v,
    ]),
    clipper.map((point: IAutoMoviePatternPoint): [number, number] => [
      point.u,
      point.v,
    ]),
  ).map(
    (point: [number, number]): IAutoMoviePatternPoint => ({
      u: point[0],
      v: point[1],
    }),
  );
}
