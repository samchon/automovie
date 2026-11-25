import {
  closestPointOnSegmentXZ,
  convexHull2D,
  nearestHullEdge,
  pointHullDistance,
  pointInHull,
} from "@automovie/engine";
import type {
  IAutoMovieHullEdge,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * Planar hull construction and point queries on the XZ plane.
 *
 * Scenarios:
 *
 * 1. The square (0,0) (2,0) (2,2) (0,2) with the interior point (1,1) has four
 *    hull vertices; duplicates collapse ((0,0) twice and (1,0) gives two);
 *    three collinear points give two; one point gives one; none gives none; the
 *    equal-x column (0,2) (0,0) with (2,1) gives three.
 * 2. `pointInHull`: (1,1) is inside the square, (3,1) is outside, and a two-vertex
 *    hull encloses nothing.
 * 3. `pointHullDistance`: 0 inside, 1 for (3,1) beside the square, 3 for (3,0)
 *    from a one-vertex hull, 1 for (1,1) from the segment hull (0,0)-(2,0),
 *    Infinity for the empty hull.
 * 4. `nearestHullEdge` of (3,1) on the square has distance 1; of (3,0) on a
 *    one-vertex hull has distance 3 and a collapsed edge; of any point on an
 *    empty hull is refused.
 * 5. `closestPointOnSegmentXZ` on (0,0)-(2,0): (-1,0) clamps to (0,0), (1,1)
 *    projects to (1,0), (3,0) clamps to (2,0); a zero-length segment gives its
 *    own point.
 */
export function test_engine_math_convex_hull(): void {
  const v = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const square: IAutoMovieVector3[] = convexHull2D([
    v(0, 0),
    v(2, 0),
    v(2, 2),
    v(0, 2),
    v(1, 1),
  ]);
  TestValidator.equals("square", square.length, 4);
  TestValidator.equals(
    "duplicates",
    convexHull2D([v(0, 0), v(0, 0), v(1, 0)]).length,
    2,
  );
  TestValidator.equals(
    "collinear",
    convexHull2D([v(0, 0), v(1, 0), v(2, 0)]).length,
    2,
  );
  TestValidator.equals("single", convexHull2D([v(5, 5)]).length, 1);
  TestValidator.equals("empty", convexHull2D([]).length, 0);
  TestValidator.equals(
    "equal x",
    convexHull2D([v(0, 2), v(0, 0), v(2, 1)]).length,
    3,
  );

  TestValidator.equals("inside", pointInHull(v(1, 1), square), true);
  TestValidator.equals("outside", pointInHull(v(3, 1), square), false);
  TestValidator.equals(
    "segment hull",
    pointInHull(v(0, 0), convexHull2D([v(0, 0), v(1, 0)])),
    false,
  );

  TestValidator.equals(
    "distance inside",
    pointHullDistance(v(1, 1), square),
    0,
  );
  TestValidator.equals(
    "distance beside",
    pointHullDistance(v(3, 1), square),
    1,
  );
  TestValidator.equals(
    "distance to vertex",
    pointHullDistance(v(3, 0), [v(0, 0)]),
    3,
  );
  TestValidator.equals(
    "distance to nothing",
    pointHullDistance(v(0, 0), []),
    Infinity,
  );
  TestValidator.equals(
    "distance to segment",
    pointHullDistance(v(1, 1), [v(0, 0), v(2, 0)]),
    1,
  );

  const edge: IAutoMovieHullEdge = nearestHullEdge(v(3, 1), square);
  TestValidator.equals("nearest edge distance", edge.distance, 1);
  const single: IAutoMovieHullEdge = nearestHullEdge(v(3, 0), [v(0, 0)]);
  TestValidator.equals("single vertex distance", single.distance, 3);
  TestValidator.equals("collapsed edge", single.start, single.end);
  TestValidator.predicate(
    "empty hull",
    throwsError(() => nearestHullEdge(v(0, 0), []), ["nonempty hull"]),
  );

  TestValidator.equals(
    "clamp before",
    closestPointOnSegmentXZ(v(-1, 0), v(0, 0), v(2, 0)),
    v(0, 0),
  );
  TestValidator.equals(
    "project",
    closestPointOnSegmentXZ(v(1, 1), v(0, 0), v(2, 0)),
    v(1, 0),
  );
  TestValidator.equals(
    "clamp after",
    closestPointOnSegmentXZ(v(3, 0), v(0, 0), v(2, 0)),
    v(2, 0),
  );
  TestValidator.equals(
    "zero length",
    closestPointOnSegmentXZ(v(1, 1), v(5, 5), v(5, 5)),
    v(5, 5),
  );
}
