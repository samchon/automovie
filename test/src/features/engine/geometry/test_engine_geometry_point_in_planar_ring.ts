import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `pointInPlanarRing(point, ring)` classifies a point off the ring by the
 * even-odd rule along +x, for either winding.
 *
 * Scenarios:
 *
 * 1. The unit square, either winding: (0.5, 0.5) inside, (1.5, 0.5) and (0.5,
 *    -0.5) outside.
 * 2. The L (0,0), (2,0), (2,1), (1,1), (1,2), (0,2): (0.5, 1.5) and (1.5, 0.5)
 *    inside, (1.5, 1.5) in the notch outside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the off-edge condition and both winding orders, plus the concave notch case.
 * @evidence contracts/development/testing.md#behavioral-verification Queries the actual ring classifier on inside and outside points for the square and on the arms and notch of an L.
 * @evidence contracts/development/testing.md#independent-expectations The unit square's coordinate bounds classify its three points. Each arm of the L contains its probe, while (1.5,1.5) lies in the removed upper corner.
 */
export function test_engine_geometry_point_in_planar_ring(): void {
  const ring = (...xy: number[]): IAutoMoviePlanarPoint[] =>
    Array.from({ length: xy.length / 2 }, (_: unknown, i: number) => ({
      x: xy[2 * i]!,
      y: xy[2 * i + 1]!,
    }));

  // 1.
  const square: IAutoMoviePlanarPoint[] = ring(0, 0, 1, 0, 1, 1, 0, 1);
  for (const [label, r] of [
    ["ccw", square],
    ["cw", [...square].reverse()],
  ] satisfies [string, IAutoMoviePlanarPoint[]][])
    TestValidator.equals(
      label,
      [
        AutoMovieEngineGeometry.pointInPlanarRing({ x: 0.5, y: 0.5 }, r),
        AutoMovieEngineGeometry.pointInPlanarRing({ x: 1.5, y: 0.5 }, r),
        AutoMovieEngineGeometry.pointInPlanarRing({ x: 0.5, y: -0.5 }, r),
      ],
      [true, false, false],
    );

  // 2.
  const l: IAutoMoviePlanarPoint[] = ring(0, 0, 2, 0, 2, 1, 1, 1, 1, 2, 0, 2);
  TestValidator.equals(
    "L",
    [
      AutoMovieEngineGeometry.pointInPlanarRing({ x: 0.5, y: 1.5 }, l),
      AutoMovieEngineGeometry.pointInPlanarRing({ x: 1.5, y: 0.5 }, l),
      AutoMovieEngineGeometry.pointInPlanarRing({ x: 1.5, y: 1.5 }, l),
    ],
    [true, true, false],
  );
}
