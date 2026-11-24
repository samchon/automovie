import { roundAutoMovieDrawingVector } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundAutoMovieDrawingVector` rounds the three world coordinates to the
 * drawing grid of six decimals.
 *
 * Scenarios:
 *
 * 1. Each component rounds at the sixth decimal.
 */
export function test_unit_engine_drawing_round_vector(): void {
  TestValidator.equals(
    "six decimals on each axis",
    roundAutoMovieDrawingVector({ x: 1.0000004, y: 2.0000006, z: -3.5 }),
    { x: 1, y: 2.000001, z: -3.5 },
  );
}
