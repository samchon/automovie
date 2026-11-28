import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `segmentSegmentDistance` is the minimum separation of two bounded segments.
 *
 * Scenarios:
 *
 * 1. Two parallel segments one apart are 1 apart.
 * 2. A skew pair whose lines pass at y = 1 is 1 apart.
 * 3. Crossing segments are 0 apart.
 * 4. Collinear segments with a gap of 2 are 2 apart.
 * 5. A segment collapsed at the origin lying on the x-axis segment (-1..1) is 0
 *    away; collapsed at (0, 2, 0) it is 2 away, finite and exact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers distance for parallel, skew, crossing, collinear and collapsed segments.
 * @evidence contracts/development/testing.md#behavioral-verification Calls segmentSegmentDistance directly with typed segment endpoints for each arrangement.
 * @evidence contracts/development/testing.md#independent-expectations The parallel and skew fixtures have one-unit perpendicular gaps, crossing gives zero and the collinear endpoints leave a gap of two. A collapsed segment acts as its single point.
 */
export function test_engine_math_segment_segment_distance(): void {
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
    d: IAutoMovieVector3,
    expected: number,
  ): boolean => nclose(AutoMovieEngineMath.segmentSegmentDistance(a, b, c, d), expected, 1e-12);
  TestValidator.predicate(
    "parallel",
    near(p(0, 0, 0), p(1, 0, 0), p(0, 1, 0), p(1, 1, 0), 1),
  );
  TestValidator.predicate(
    "skew",
    near(p(-1, 0, 0), p(1, 0, 0), p(0, 1, 1), p(0, 1, -1), 1),
  );
  TestValidator.predicate(
    "crossing",
    near(p(-1, 0, 0), p(1, 0, 0), p(0, -1, 0), p(0, 1, 0), 0),
  );
  TestValidator.predicate(
    "collinear gap",
    near(p(0, 0, 0), p(1, 0, 0), p(3, 0, 0), p(4, 0, 0), 2),
  );
  const origin: IAutoMovieVector3 = p(0, 0, 0);
  TestValidator.predicate(
    "collapsed on a segment",
    near(origin, origin, p(-1, 0, 0), p(1, 0, 0), 0),
  );
  TestValidator.predicate(
    "collapsed clear of a segment",
    near(p(0, 2, 0), p(0, 2, 0), p(-1, 0, 0), p(1, 0, 0), 2),
  );
}
