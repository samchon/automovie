import { roundAutoMovieDrawingPoint } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundAutoMovieDrawingPoint` rounds both page coordinates to the drawing grid
 * of six decimals, a negative zero becoming 0.
 *
 * Scenarios:
 *
 * 1. 0.1234564 rounds down and 0.1234566 rounds up at the sixth decimal.
 * 2. A tiny negative value rounds to a positive zero.
 */
export function test_unit_engine_drawing_round_point(): void {
  TestValidator.equals(
    "six decimals",
    roundAutoMovieDrawingPoint({ x: 0.1234564, y: 0.1234566 }),
    { x: 0.123456, y: 0.123457 },
  );
  TestValidator.predicate(
    "no negative zero",
    Object.is(roundAutoMovieDrawingPoint({ x: -1e-9, y: 0 }).x, 0),
  );
}