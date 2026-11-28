import { AutoMovieEngineText, AutoMovieEngineGeometry } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

type P = [number, number];

/**
 * `intersectConvexPolygons(subject, boundary)` clips a convex subject
 * by a convex boundary (Sutherland-Hodgman), keeping the subject's winding;
 * either may wind either way.
 *
 * Scenarios:
 *
 * 1. [0, 2]^2 clipped by [1, 3]^2, both counter-clockwise: (1,1), (2,1), (2,2),
 *    (1,2).
 * 2. The boundary wound clockwise gives the same four corners; a clockwise subject
 *    gives a clockwise result of area 1.
 * 3. A disjoint boundary and a zero-area (collinear) boundary give [].
 * 4. [0, 1]^2 by [1, 2]^2 touch along x = 1: the zero-area outline [(1, 1)].
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names overlap corners and winding, disjoint and collapsed input and zero-area contact.
 * @evidence contracts/development/testing.md#behavioral-verification Clips squares in both subject and boundary orders, then calls the same operation for disjoint, collinear and touching inputs.
 * @evidence contracts/development/testing.md#independent-expectations The coordinate interval overlap [1, 2] by [1, 2] fixes the four overlap corners. Changing the subject order reverses winding. The touching fixture has no positive area.
 */
export function test_engine_geometry_intersect_convex_polygons(): void {
  const square = (lo: number, hi: number): P[] => [
    [lo, lo],
    [hi, lo],
    [hi, hi],
    [lo, hi],
  ];
  const area = (polygon: P[]): number =>
    polygon.reduce((s: number, a: P, i: number): number => {
      const b: P = polygon[(i + 1) % polygon.length]!;
      return s + a[0] * b[1] - a[1] * b[0];
    }, 0) / 2;
  const sorted = (polygon: P[]): string[] =>
    polygon
      .map((p: P): string => p.join(","))
      .sort(AutoMovieEngineText.compareCodeUnits);

  // 1.
  TestValidator.equals(
    "ccw",
    AutoMovieEngineGeometry.intersectConvexPolygons(square(0, 2), square(1, 3)),
    [
      [1, 1],
      [2, 1],
      [2, 2],
      [1, 2],
    ],
  );

  // 2.
  TestValidator.equals(
    "cw boundary",
    sorted(
      AutoMovieEngineGeometry.intersectConvexPolygons(square(0, 2), square(1, 3).reverse()),
    ),
    ["1,1", "1,2", "2,1", "2,2"],
  );
  TestValidator.equals(
    "cw subject",
    area(
      AutoMovieEngineGeometry.intersectConvexPolygons(square(0, 2).reverse(), square(1, 3)),
    ),
    -1,
  );

  // 3.
  TestValidator.equals(
    "disjoint",
    AutoMovieEngineGeometry.intersectConvexPolygons(square(0, 1), square(5, 6)),
    [],
  );
  TestValidator.equals(
    "zero-area boundary",
    AutoMovieEngineGeometry.intersectConvexPolygons(square(0, 1), [
      [0, 0],
      [1, 0],
      [2, 0],
    ]),
    [],
  );

  // 4.
  TestValidator.equals(
    "touch",
    AutoMovieEngineGeometry.intersectConvexPolygons(square(0, 1), square(1, 2)),
    [[1, 1]],
  );
}
