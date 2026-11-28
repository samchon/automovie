import { AutoMovieEngineDrawing } from "@automovie/engine";
import type { IAutoMovieDrawingFrame } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one dot product. */
const ROUNDING: number = 1e-12;

/** A frame at (1, 1, 0) looking along +Z with right +X and up +Y. */
const FRAME: IAutoMovieDrawingFrame = {
  origin: { x: 1, y: 1, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  normal: { x: 0, y: 0, z: 1 },
};

/**
 * `projectDrawingPoint` lays a world point on the page: its offset
 * from the frame origin along `right` and `up`.
 *
 * Scenarios:
 *
 * 1. A point 3 right and 2 up of the origin is at page (3, 2), whatever its depth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the frame-relative right and up offsets when the point has a nonzero depth.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.projectAutoMovieDrawingPoint with a displaced frame and a point with nonzero depth, then checks both page coordinates.
 * @evidence contracts/development/testing.md#independent-expectations Subtracting origin (1, 1, 0) from point (4, 3, 7) yields offset (3, 2, 7). Its X and Y components fix the page coordinate (3, 2).
 */
export function test_engine_drawing_project_point(): void {
  const page: { x: number; y: number } =
    AutoMovieEngineDrawing.projectAutoMovieDrawingPoint(FRAME, {
      x: 4,
      y: 3,
      z: 7,
    });
  TestValidator.predicate(
    "right and up offsets",
    nclose(page.x, 3, ROUNDING) && nclose(page.y, 2, ROUNDING),
  );
}
