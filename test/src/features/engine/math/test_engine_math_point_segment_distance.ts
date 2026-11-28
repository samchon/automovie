import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `pointSegmentDistance` is the distance from a point to a closed segment.
 *
 * Scenarios:
 *
 * 1. A point above the middle of a segment on the x axis is 1 away.
 * 2. A point past an endpoint measures to that endpoint: (3, 0, 0) is 2 from the
 *    segment (-1..1).
 * 3. Coincident endpoints give the point distance: (0, 3, 4) is 5.
 * 4. A point (3, 4, 0) to a segment collapsed at the origin is 5, not NaN.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers perpendicular interior projection, clamping to an endpoint and coincident endpoints.
 * @evidence contracts/development/testing.md#behavioral-verification Calls pointSegmentDistance on typed points and bounded segments, including two collapsed cases.
 * @evidence contracts/development/testing.md#independent-expectations The axial fixtures give a perpendicular distance of one and an endpoint gap of two. Both collapsed fixtures reduce to a 3-4-5 point distance.
 */
export function test_engine_math_point_segment_distance(): void {
  const a: IAutoMovieVector3 = { x: -1, y: 0, z: 0 };
  const b: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const near = (
    x: number,
    y: number,
    z: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): number => AutoMovieEngineMath.pointSegmentDistance({ x, y, z }, from, to);
  TestValidator.predicate("interior", nclose(near(0, 1, 0, a, b), 1, 1e-12));
  TestValidator.predicate("past end", nclose(near(3, 0, 0, a, b), 2, 1e-12));
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  TestValidator.predicate(
    "degenerate",
    nclose(near(0, 3, 4, origin, origin), 5, 1e-12),
  );
  TestValidator.predicate(
    "collapsed segment",
    nclose(near(3, 4, 0, origin, origin), 5, 1e-12),
  );
}
