import { roundAutoMovieDrawingScalar } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundAutoMovieDrawingScalar` rounds to six decimal places, halves upward,
 * and never returns −0.
 *
 * Scenarios:
 *
 * 1. 1.23456749 rounds down to 1.234567 and 1.23456751 up to 1.234568.
 * 2. −0.0000001 rounds to 0, not −0.
 */
export function test_unit_engine_drawing_round_scalar(): void {
  TestValidator.equals(
    "down",
    roundAutoMovieDrawingScalar(1.23456749),
    1.234567,
  );
  TestValidator.equals("up", roundAutoMovieDrawingScalar(1.23456751), 1.234568);
  TestValidator.predicate(
    "no negative zero",
    Object.is(roundAutoMovieDrawingScalar(-0.0000001), 0),
  );
}
