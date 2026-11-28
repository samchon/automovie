import { AutoMovieEngineDrawing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `drawingRange` is the least and greatest of a sequence of values.
 *
 * Scenarios:
 *
 * 1. Three values give their minimum and maximum.
 * 2. An empty sequence gives the identity bounds +Infinity and -Infinity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the extrema of a nonempty sequence and the signed infinity identities for an empty sequence.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.autoMovieDrawingRange directly with three unsorted numbers and an empty list.
 * @evidence contracts/development/testing.md#independent-expectations Of 2, -1 and 5 the least is -1 and greatest is 5. The empty result starts the minimum at positive infinity and maximum at negative infinity.
 */
export function test_engine_drawing_range(): void {
  TestValidator.equals(
    "minimum and maximum",
    AutoMovieEngineDrawing.autoMovieDrawingRange([2, -1, 5]),
    { min: -1, max: 5 },
  );
  TestValidator.equals(
    "an empty sequence",
    AutoMovieEngineDrawing.autoMovieDrawingRange([]),
    {
      min: Infinity,
      max: -Infinity,
    },
  );
}
