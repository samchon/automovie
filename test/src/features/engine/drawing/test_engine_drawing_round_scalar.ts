import { AutoMovieEngineDrawing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundDrawingScalar` rounds to six decimal places, halves upward,
 * and never returns −0.
 *
 * Scenarios:
 *
 * 1. 1.23456749 rounds down to 1.234567 and 1.23456751 up to 1.234568.
 * 2. −0.0000001 rounds to 0, not −0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the six-decimal grid, values immediately on either side of one midpoint, and positive zero for the tiny negative sample.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.roundAutoMovieDrawingScalar on two positive values and one tiny negative value and distinguishes signed zero with Object.is.
 * @evidence contracts/development/testing.md#independent-expectations The midpoint 1.2345675 separates grid coordinates 1.234567 and 1.234568. The two positive samples lie on opposite sides, and -1e-7 rounds to positive zero.
 */
export function test_engine_drawing_round_scalar(): void {
  TestValidator.equals(
    "down",
    AutoMovieEngineDrawing.roundAutoMovieDrawingScalar(1.23456749),
    1.234567,
  );
  TestValidator.equals(
    "up",
    AutoMovieEngineDrawing.roundAutoMovieDrawingScalar(1.23456751),
    1.234568,
  );
  TestValidator.predicate(
    "no negative zero",
    Object.is(
      AutoMovieEngineDrawing.roundAutoMovieDrawingScalar(-0.0000001),
      0,
    ),
  );
}
