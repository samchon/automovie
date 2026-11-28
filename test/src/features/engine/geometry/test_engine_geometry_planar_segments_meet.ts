import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `planarSegmentsMeet(a0, a1, b0, b1)` says whether two closed segments share a
 * point, touching included, within the absolute 1e-12 tolerance.
 *
 * Scenarios:
 *
 * 1. The diagonals of the square [0, 2]^2 cross: true.
 * 2. A T (a stem ending on the bar), a shared endpoint and overlapping collinear
 *    segments meet; a stem ending 1e-6 short of the bar does not.
 * 3. Parallel, and collinear but disjoint, segments do not meet.
 * 4. A zero-length segment at (0.5, 0) meets the segment through it; one at (5,
 *    0), on that segment's line beyond its end, does not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names proper crossing, closed endpoint and collinear contact, disjoint edges and point segments.
 * @evidence contracts/development/testing.md#behavioral-verification Queries the public segment predicate on explicit crossing and non-crossing coordinates, including a stem one micrometre short.
 * @evidence contracts/development/testing.md#independent-expectations The diagonals intersect and endpoint-inclusive intervals meet on the written touches. The short stem's gap exceeds the declared tolerance. A point outside the closed interval cannot meet.
 */
export function test_engine_geometry_planar_segments_meet(): void {
  const p = (x: number, y: number): IAutoMoviePlanarPoint => ({ x, y });
  for (const [label, a0, a1, b0, b1, meet] of [
    // 1.
    ["diagonals", p(0, 0), p(2, 2), p(0, 2), p(2, 0), true],
    // 2.
    ["T", p(0, 0), p(2, 0), p(1, 0), p(1, 1), true],
    ["endpoint", p(0, 0), p(1, 0), p(1, 0), p(2, 1), true],
    ["overlap", p(0, 0), p(2, 0), p(1, 0), p(3, 0), true],
    ["short stem", p(0, 0), p(2, 0), p(1, 1e-6), p(1, 1), false],
    // 3.
    ["parallel", p(0, 0), p(1, 0), p(0, 1), p(1, 1), false],
    ["collinear apart", p(0, 0), p(1, 0), p(2, 0), p(3, 0), false],
    // 4.
    ["point on", p(0.5, 0), p(0.5, 0), p(0, 0), p(1, 0), true],
    ["point beyond", p(5, 0), p(5, 0), p(0, 0), p(1, 0), false],
  ] satisfies [
    string,
    IAutoMoviePlanarPoint,
    IAutoMoviePlanarPoint,
    IAutoMoviePlanarPoint,
    IAutoMoviePlanarPoint,
    boolean,
  ][]) {
    TestValidator.equals(label, AutoMovieEngineGeometry.planarSegmentsMeet(a0, a1, b0, b1), meet);
    TestValidator.equals(
      `${label} swapped`,
      AutoMovieEngineGeometry.planarSegmentsMeet(b0, b1, a0, a1),
      meet,
    );
  }
}
