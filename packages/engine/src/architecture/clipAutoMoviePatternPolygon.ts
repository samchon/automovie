import { intersectAutoMovieConvexPolygons } from "../geometry/intersectAutoMovieConvexPolygons";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * Clip a convex face-local pattern outline by its canonical counter-clockwise boundary.
 *
 * Pattern coordinates remain face-local metres; this adapter changes their record shape only. The shared Sutherland-Hodgman operation retains subject winding and previous/current traversal order. Strict crossings avoid duplicate corners on an edge. Disjoint inputs yield an empty list; point or line contact can yield a zero-area outline. Finite convex well-scaled coordinates remain caller premises without directed rounding or independent convexity validation here.
 *
 * @param subject Convex outline to clip, in face-local metres.
 * @param clipper Counter-clockwise convex outline in the same frame and unit.
 * @returns Newly allocated intersection records, possibly empty or zero-area.
 *
 * @evidence contracts/common.md#principled-implementation Delegates the established Sutherland-Hodgman algorithm after a record conversion; the generic signed orientation handles the canonical counter-clockwise pattern input with the same half-plane tests.
 * @evidence contracts/common.md#clear-and-simple-design Pattern owns its u/v metre vocabulary while the shared planar operation owns geometry, so pattern and actual footprint consumers use one algorithm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No outline or expected corner is special-cased; strict on-edge crossings are the clipping rule rather than a tolerance compensation.
 * @evidence contracts/common.md#meaningful-documentation States frame, units, winding, record ownership, zero-area contact and the remaining floating-point premises.
 * @evidence contracts/performance.md#efficient-algorithms Two linear record conversions surround conservative O(M(N+M)) clipping time for N subject vertices and M edges, with O(N+M) live storage including converted outlines.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure adapter coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Converted tuples and intermediate outlines are call-local; returned pattern records belong to the caller and no cache survives.
 */
export const clipAutoMoviePatternPolygon: (
  subject: readonly IAutoMoviePatternPoint[],
  clipper: readonly IAutoMoviePatternPoint[],
) => IAutoMoviePatternPoint[] = (
  subject: readonly IAutoMoviePatternPoint[],
  clipper: readonly IAutoMoviePatternPoint[],
): IAutoMoviePatternPoint[] =>
  intersectAutoMovieConvexPolygons(
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
