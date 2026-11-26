import { AutoMovieEngineDrawing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieDrawingRange` is the least and greatest of a sequence of values.
 *
 * Scenarios:
 *
 * 1. Three values give their minimum and maximum.
 * 2. An empty sequence gives the identity bounds +Infinity and -Infinity.
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
