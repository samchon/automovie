import { AutoMovieEngineDrawing } from "@automovie/engine";
import type {
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingTriangle,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The plane z = 0 whose normal +Z faces the viewer. */
const FRAME: IAutoMovieDrawingFrame = {
  origin: { x: 0, y: 0, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  normal: { x: 0, y: 0, z: 1 },
};

/**
 * `clipDrawingTriangles` keeps the part of each triangle on or behind
 * the plane (distance <= epsilon along the normal).
 *
 * Scenarios:
 *
 * 1. A triangle at z = -1 is kept whole, and one at z = +1 is dropped.
 * 2. A triangle with one corner at z = -1 and two at z = +1 is cut at z = 0 to the
 *    corner (0, 0, -1) and the midpoints (0.5, 0, 0) and (0, 0.5, 0).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies whole retention, full rejection and one-behind two-ahead clipping along the authored plane.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.clipAutoMovieDrawingTriangles directly with a fixed frame and typed triangles, comparing the output vertices and order.
 * @evidence contracts/development/testing.md#independent-expectations With endpoint z coordinates -1 and 1, each crossing is halfway along the edge. The original behind vertex and the two listed midpoints fix the clipped triangle exactly.
 */
export function test_engine_drawing_clip_triangles(): void {
  const behind: IAutoMovieDrawingTriangle = {
    a: { x: 0, y: 0, z: -1 },
    b: { x: 1, y: 0, z: -1 },
    c: { x: 0, y: 1, z: -1 },
  };
  const ahead: IAutoMovieDrawingTriangle = {
    a: { x: 0, y: 0, z: 1 },
    b: { x: 1, y: 0, z: 1 },
    c: { x: 0, y: 1, z: 1 },
  };
  TestValidator.equals(
    "whole and dropped",
    AutoMovieEngineDrawing.clipAutoMovieDrawingTriangles(FRAME, [
      behind,
      ahead,
    ]),
    [behind],
  );
  TestValidator.equals(
    "a cut triangle",
    AutoMovieEngineDrawing.clipAutoMovieDrawingTriangles(FRAME, [
      {
        a: { x: 0, y: 0, z: -1 },
        b: { x: 1, y: 0, z: 1 },
        c: { x: 0, y: 1, z: 1 },
      },
    ]),
    [
      {
        a: { x: 0, y: 0, z: -1 },
        b: { x: 0.5, y: 0, z: 0 },
        c: { x: 0, y: 0.5, z: 0 },
      },
    ],
  );
}
