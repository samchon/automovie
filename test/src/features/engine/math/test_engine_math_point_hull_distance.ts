import { pointHullDistance } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `pointHullDistance` is the distance on the XZ plane from a point to a convex
 * hull, 0 inside.
 *
 * Hull: the unit square with corners (0,0), (1,0), (1,1), (0,1) in (x, z).
 *
 * Scenarios:
 *
 * 1. A point inside is 0; a point (2, 0.5) beside an edge is 1; a point (4, 5)
 *    past the corner (1, 1) is 5.
 * 2. An empty hull is Infinity; a one-vertex hull gives the vertex distance.
 */
export function test_engine_math_point_hull_distance(): void {
  const p = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const square: IAutoMovieVector3[] = [p(0, 0), p(1, 0), p(1, 1), p(0, 1)];
  TestValidator.equals("inside", pointHullDistance(p(0.5, 0.5), square), 0);
  TestValidator.predicate(
    "edge",
    nclose(pointHullDistance(p(2, 0.5), square), 1, 1e-12),
  );
  TestValidator.predicate(
    "corner",
    nclose(pointHullDistance(p(4, 5), square), 5, 1e-12),
  );
  TestValidator.equals("empty", pointHullDistance(p(0, 0), []), Infinity);
  TestValidator.predicate(
    "vertex",
    nclose(pointHullDistance(p(3, 4), [p(0, 0)]), 5, 1e-12),
  );
}
