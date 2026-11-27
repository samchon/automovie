import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieClosestSegmentPoints } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `closestPointsBetweenSegments` gives the witnesses of the separation of two
 * bounded segments.
 *
 * Scenarios:
 *
 * 1. Collinear segments (0..1) and (2..3) on the x axis: the facing endpoints
 *    (1,0,0) and (2,0,0) are the witnesses and the distance is the gap 1.
 * 2. A segment (0,0,0)-(1,0,0) and one (0,0,0)-(0,0,1) sharing an endpoint touch:
 *    distance 0 and both witnesses coincide.
 */
export function test_engine_math_closest_points(): void {
  const gap: IAutoMovieClosestSegmentPoints = AutoMovieEngineMath.closestPointsBetweenSegments(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  );
  TestValidator.equals("gap", gap.distance, 1);
  TestValidator.equals("first witness", gap.pointA, { x: 1, y: 0, z: 0 });
  TestValidator.equals("second witness", gap.pointB, { x: 2, y: 0, z: 0 });
  const touching: IAutoMovieClosestSegmentPoints = AutoMovieEngineMath.closestPointsBetweenSegments(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
  );
  TestValidator.equals("touching distance", touching.distance, 0);
  TestValidator.equals("touching witnesses", touching.pointA, touching.pointB);
}
