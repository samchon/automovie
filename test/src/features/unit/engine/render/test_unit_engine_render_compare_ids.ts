import { compareAutoMovieRenderIds } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `compareAutoMovieRenderIds` orders ids by code unit.
 *
 * Scenarios:
 *
 * 1. "B" (0x42) precedes "a" (0x61), and the reverse follows.
 * 2. Equal ids compare as 0.
 */
export function test_unit_engine_render_compare_ids(): void {
  TestValidator.equals(
    "code-unit order",
    [
      compareAutoMovieRenderIds("B", "a"),
      compareAutoMovieRenderIds("a", "B"),
      compareAutoMovieRenderIds("id", "id"),
    ],
    [-1, 1, 0],
  );
}
