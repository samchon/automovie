import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieHullEdge, closestPointOnSegmentXZ, convexHull2D, nearestHullEdge, pointHullDistance, pointInHull } from "@automovie/engine";





import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

const v: (x: number, z: number) => IAutoMovieVector3 = (
  x: number,
  z: number,
): IAutoMovieVector3 => ({ x, y: 0, z });

/**
 * Planar hull construction and point queries retain the authored degenerate
 * populations and hand-calculated horizontal distances.
 *
 * Scenarios:
 *
 * 1. A square with an interior point gives four hull vertices and the declared
 *    interior/exterior distance behavior; individual hull coordinates are not asserted.
 * 2. Duplicate points collapse; three collinear points give two hull vertices;
 *    one/zero points pass through; an equal-x column exercises the secondary
 *    sort key.
 * 3. PointInHull: inside true, outside false, a degenerate (<3-vertex) hull
 *    encloses nothing.
 * 4. PointHullDistance: 0 inside, the edge gap outside, the vertex distance for a
 *    point hull, the segment distance for a 2-vertex hull, Infinity for empty.
 * 5. NearestHullEdge: the nearest boundary edge and its distance; a single-vertex
 *    hull degenerates to a zero-length edge.
 * 6. ClosestPointOnSegmentXZ clamps before the start, projects onto the middle,
 *    clamps past the end, and survives a zero-length segment.
 * 7. An empty hull refuses a nearest-edge query rather than returning absent endpoints.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs hull construction, containment, boundary distance and projection, asserting declared geometry and a named empty-nearest-edge refusal rather than accepting missing endpoints.
 * @evidence contracts/testing.md#independent-expectations Square, collinear and singleton coordinates determine expected hull populations and analytic point/segment gaps; assertions use those authored dimensions rather than captured product output.
 * @evidence contracts/testing.md#distinguishing-cases Covers interior/exterior/edge queries, duplicates, collinear/empty/singleton hulls, secondary sorting and clamped/zero-length projection; small-scale tests own tiny nonzero spans.
 * @evidence contracts/testing.md#execution-ownership The discoverable math function owns its local planar cases and directly calls TypeScript geometry without a renderer, external process or native build.
 */
export function test_math_convex_hull(): void {
  TestValidator.predicate(
    "an empty hull has no boundary edge to return",
    throwsError(
      (): IAutoMovieHullEdge => nearestHullEdge(v(0, 0), []),
      "nonempty hull",
    ),
  );
  const square: IAutoMovieVector3[] = convexHull2D([
    v(0, 0),
    v(2, 0),
    v(2, 2),
    v(0, 2),
    v(1, 1),
  ]);
  TestValidator.equals("square hull drops interior point", square.length, 4);
  TestValidator.equals(
    "duplicate points collapse",
    convexHull2D([v(0, 0), v(0, 0), v(1, 0)]).length,
    2,
  );
  TestValidator.equals(
    "collinear collapses to two extremes",
    convexHull2D([v(0, 0), v(1, 0), v(2, 0)]).length,
    2,
  );
  TestValidator.equals("single point hull", convexHull2D([v(5, 5)]).length, 1);
  TestValidator.equals("empty hull", convexHull2D([]).length, 0);
  TestValidator.equals(
    "equal-x column builds a triangle",
    convexHull2D([v(0, 2), v(0, 0), v(2, 1)]).length,
    3,
  );

  TestValidator.equals("inside the square", pointInHull(v(1, 1), square), true);
  TestValidator.equals(
    "outside the square",
    pointInHull(v(3, 1), square),
    false,
  );
  TestValidator.equals(
    "a segment hull encloses nothing",
    pointInHull(v(0, 0), convexHull2D([v(0, 0), v(1, 0)])),
    false,
  );

  TestValidator.predicate(
    "distance inside is 0",
    nclose(pointHullDistance(v(1, 1), square), 0),
  );
  TestValidator.predicate(
    "distance outside is the edge gap",
    nclose(pointHullDistance(v(3, 1), square), 1),
  );
  TestValidator.predicate(
    "distance to a single vertex",
    nclose(pointHullDistance(v(3, 0), [v(0, 0)]), 3),
  );
  TestValidator.predicate(
    "distance to empty is Infinity",
    pointHullDistance(v(0, 0), []) === Infinity,
  );
  TestValidator.predicate(
    "distance to a segment hull",
    nclose(pointHullDistance(v(1, 1), [v(0, 0), v(2, 0)]), 1),
  );

  const edge: IAutoMovieHullEdge = nearestHullEdge(v(3, 1), square);
  TestValidator.predicate("nearest edge distance", nclose(edge.distance, 1));
  const single: IAutoMovieHullEdge = nearestHullEdge(v(3, 0), [v(0, 0)]);
  TestValidator.equals(
    "single-vertex hull yields a zero-length edge",
    namedFacts([
      ["vertexDistance", (): boolean => nclose(single.distance, 3)],
      ["edgeCollapsed", (): boolean => vclose(single.start, single.end)],
    ]),
    { vertexDistance: true, edgeCollapsed: true },
  );

  TestValidator.predicate(
    "clamp before the start",
    vclose(closestPointOnSegmentXZ(v(-1, 0), v(0, 0), v(2, 0)), v(0, 0)),
  );
  TestValidator.predicate(
    "project onto the middle",
    vclose(closestPointOnSegmentXZ(v(1, 1), v(0, 0), v(2, 0)), v(1, 0)),
  );
  TestValidator.predicate(
    "clamp past the end",
    vclose(closestPointOnSegmentXZ(v(3, 0), v(0, 0), v(2, 0)), v(2, 0)),
  );
  TestValidator.predicate(
    "zero-length segment returns its point",
    vclose(closestPointOnSegmentXZ(v(1, 1), v(5, 5), v(5, 5)), v(5, 5)),
  );
}
