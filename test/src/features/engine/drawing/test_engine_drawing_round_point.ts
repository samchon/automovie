import { AutoMovieEngineDrawing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundDrawingPoint` rounds both page coordinates to the drawing grid
 * of six decimals, a negative zero becoming 0.
 *
 * Scenarios:
 *
 * 1. 0.1234564 rounds down and 0.1234566 rounds up at the sixth decimal.
 * 2. A tiny negative value rounds to a positive zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names down and up rounding on different page axes and the normalization of small negative output to positive zero.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.roundAutoMovieDrawingPoint on fixed pairs, comparing both coordinates and testing signed zero using Object.is.
 * @evidence contracts/development/testing.md#independent-expectations The points straddle the sixth-decimal midpoint, so the pair rounds to (0.123456, 0.123457). At -1e-9 the nearest grid coordinate is zero, whose sign the contract fixes.
 */
export function test_engine_drawing_round_point(): void {
  TestValidator.equals(
    "six decimals",
    AutoMovieEngineDrawing.roundAutoMovieDrawingPoint({
      x: 0.1234564,
      y: 0.1234566,
    }),
    { x: 0.123456, y: 0.123457 },
  );
  TestValidator.predicate(
    "no negative zero",
    Object.is(
      AutoMovieEngineDrawing.roundAutoMovieDrawingPoint({ x: -1e-9, y: 0 }).x,
      0,
    ),
  );
}
