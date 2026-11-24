import { autoMovieDrawingPolygonArea } from "@automovie/engine";
import type { IAutoMovieDrawingPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieDrawingPolygonArea` is the shoelace area of a closed ring,
 * unsigned.
 *
 * Scenarios:
 *
 * 1. A 3 × 2 rectangle in either winding: 6 m².
 * 2. The right triangle (0,0), (4,0), (0,3): 6 m².
 * 3. Two corners enclose nothing: 0.
 */
export function test_unit_engine_drawing_polygon_area(): void {
  const rectangle: IAutoMovieDrawingPoint[] = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
  ];
  TestValidator.equals(
    "counter-clockwise",
    autoMovieDrawingPolygonArea(rectangle),
    6,
  );
  TestValidator.equals(
    "clockwise",
    autoMovieDrawingPolygonArea([...rectangle].reverse()),
    6,
  );
  TestValidator.equals(
    "a triangle",
    autoMovieDrawingPolygonArea([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
    ]),
    6,
  );
  TestValidator.equals(
    "two corners",
    autoMovieDrawingPolygonArea([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]),
    0,
  );
}
