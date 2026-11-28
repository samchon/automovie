import { AutoMovieEngineDrawing } from "@automovie/engine";
import type { IAutoMovieDrawingFrame } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one dot product. */
const ROUNDING: number = 1e-12;

/** The plane through (0, 1, 0) with normal +Z. */
const FRAME: IAutoMovieDrawingFrame = {
  origin: { x: 0, y: 1, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  normal: { x: 0, y: 0, z: 1 },
};

/**
 * `drawingPlaneDistance` is the signed distance of a point from the
 * frame's plane, positive on the side its normal faces.
 *
 * Scenarios:
 *
 * 1. A point 2 m along the normal is at +2 and one 3 m behind is at -3.
 * 2. A point in the plane, however far across it, is at 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names signed positions on both sides of the plane and an offset point within it.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.autoMovieDrawingPlaneDistance with the authored +Z frame and three explicit world points.
 * @evidence contracts/development/testing.md#independent-expectations The plane is z = 0, so the signed normal offsets are the points' z components +2, -3 and 0. Nonzero tangential components cannot affect those values.
 */
export function test_engine_drawing_plane_distance(): void {
  TestValidator.predicate(
    "signed along the normal",
    nclose(
      AutoMovieEngineDrawing.autoMovieDrawingPlaneDistance(FRAME, {
        x: 9,
        y: 4,
        z: 2,
      }),
      2,
      ROUNDING,
    ) &&
      nclose(
        AutoMovieEngineDrawing.autoMovieDrawingPlaneDistance(FRAME, {
          x: 0,
          y: 0,
          z: -3,
        }),
        -3,
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "in the plane",
    nclose(
      AutoMovieEngineDrawing.autoMovieDrawingPlaneDistance(FRAME, {
        x: 5,
        y: -7,
        z: 0,
      }),
      0,
      ROUNDING,
    ),
  );
}
