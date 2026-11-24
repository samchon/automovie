import { transformAutoMovieDrawingPoint } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one affine product. */
const ROUNDING: number = 1e-12;

/**
 * `transformAutoMovieDrawingPoint` applies a column-major 4 x 4 matrix to a
 * point.
 *
 * Scenarios:
 *
 * 1. A translation by (1, 2, 3) moves the origin to (1, 2, 3).
 * 2. A quarter turn about Z (x to y, y to -x) with a translation of (0, 0, 5)
 *    sends (1, 0, 0) to (0, 1, 5).
 */
export function test_unit_engine_drawing_transform_point(): void {
  const translation: number[] = [
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1,
  ];
  TestValidator.predicate(
    "a translation",
    vclose(
      transformAutoMovieDrawingPoint(translation, { x: 0, y: 0, z: 0 }),
      { x: 1, y: 2, z: 3 },
      ROUNDING,
    ),
  );
  const turn: number[] = [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 5, 1];
  TestValidator.predicate(
    "a quarter turn and a lift",
    vclose(
      transformAutoMovieDrawingPoint(turn, { x: 1, y: 0, z: 0 }),
      { x: 0, y: 1, z: 5 },
      ROUNDING,
    ),
  );
}
