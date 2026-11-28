import { AutoMovieEngineDrawing } from "@automovie/engine";
import type { IAutoMovieDrawingPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `drawingPolygonArea` is the shoelace area of a closed ring,
 * unsigned.
 *
 * Scenarios:
 *
 * 1. A 3 × 2 rectangle in either winding: 6 m².
 * 2. The right triangle (0,0), (4,0), (0,3): 6 m².
 * 3. Two corners enclose nothing: 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names a rectangle in both windings, a right triangle and an input with two corners.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.autoMovieDrawingPolygonArea with explicit authored rings and a segment, comparing exact unsigned areas.
 * @evidence contracts/development/testing.md#independent-expectations Multiplying 3 by 2 gives rectangle area 6 in either direction. Half of base 4 times height 3 gives triangle area 6. Two points bound no region.
 */
export function test_engine_drawing_polygon_area(): void {
  const rectangle: IAutoMovieDrawingPoint[] = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
  ];
  TestValidator.equals(
    "counter-clockwise",
    AutoMovieEngineDrawing.autoMovieDrawingPolygonArea(rectangle),
    6,
  );
  TestValidator.equals(
    "clockwise",
    AutoMovieEngineDrawing.autoMovieDrawingPolygonArea(
      [...rectangle].reverse(),
    ),
    6,
  );
  TestValidator.equals(
    "a triangle",
    AutoMovieEngineDrawing.autoMovieDrawingPolygonArea([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
    ]),
    6,
  );
  TestValidator.equals(
    "two corners",
    AutoMovieEngineDrawing.autoMovieDrawingPolygonArea([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]),
    0,
  );
}
