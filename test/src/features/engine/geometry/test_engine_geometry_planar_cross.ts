import { AutoMovieEngineGeometry } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `planarCross(origin, from, to)` is twice the signed area of the triangle
 * origin, from, to: (from - origin) x (to - origin).
 *
 * Scenarios:
 *
 * 1. Origin, (1, 0), (0, 1) turns counter-clockwise: 1; swapped: -1.
 * 2. A shifted origin (1, 1) with (3, 1), (1, 4): 2 x 3 = 6.
 * 3. Collinear (0, 0), (1, 1), (2, 2): 0.
 */
export function test_engine_geometry_planar_cross(): void {
  // 1.
  TestValidator.equals(
    "ccw",
    AutoMovieEngineGeometry.planarCross({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }),
    1,
  );
  TestValidator.equals(
    "cw",
    AutoMovieEngineGeometry.planarCross({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }),
    -1,
  );

  // 2.
  TestValidator.equals(
    "shifted",
    AutoMovieEngineGeometry.planarCross({ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 4 }),
    6,
  );

  // 3.
  TestValidator.equals(
    "collinear",
    AutoMovieEngineGeometry.planarCross({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }),
    0,
  );
}
