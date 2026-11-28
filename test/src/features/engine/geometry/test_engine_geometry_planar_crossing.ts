import {
  AutoMovieEngineGeometry,
  AutoMovieEnginePlanarGeometry,
} from "@automovie/engine";
import type { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Planar ray crossings classify finite points across the binary64 range.
 *
 * Scenarios:
 *
 * 1. An oblique edge crosses the query row at the origin even though the
 *    horizontal difference of its endpoint coordinates overflows.
 * 2. The same two probes are classified when the winding is reversed.
 * 3. Architecture still includes a square's edge and excludes an outside point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the finite extreme edge, reverse winding and architecture boundary control.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public ring classifier on both sides of the crossing in both winding orders, then observes architecture's separate public boundary policy.
 * @evidence contracts/development/testing.md#independent-expectations The oblique edge has antipodal endpoints, so its intersection with the query row is their exact midpoint at the origin. Only the negative X query at that row is inside. The square has a vertical edge at X = 1 and encloses no point at X = 2.
 */
export function test_engine_geometry_planar_crossing(): void {
  const extent: number = Number.MAX_VALUE;
  const ring: IAutoMoviePlanarPoint[] = [
    { x: -extent, y: -2 },
    { x: extent, y: 2 },
    { x: extent, y: 4 },
    { x: -extent, y: 4 },
  ];
  const results: boolean[][] = [ring, [...ring].reverse()].map((boundary) => [
    AutoMovieEngineGeometry.pointInPlanarRing({ x: -1, y: 0 }, boundary),
    AutoMovieEngineGeometry.pointInPlanarRing({ x: 1, y: 0 }, boundary),
  ]);
  TestValidator.equals("parity in both orders", results, [
    [true, false],
    [true, false],
  ]);

  const square: IAutoMoviePlanarPoint[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  TestValidator.predicate(
    "architecture includes the edge",
    AutoMovieEnginePlanarGeometry.pointInPolygon({ x: 1, y: 0.5 }, square),
  );
  TestValidator.predicate(
    "architecture excludes the outside point",
    !AutoMovieEnginePlanarGeometry.pointInPolygon({ x: 2, y: 0.5 }, square),
  );
}
