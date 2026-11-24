import { autoMovieDrawingHasCut } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieDrawingHasCut` says whether a projection cuts the model: a plan and
 * a section do, an elevation does not.
 *
 * Scenarios:
 *
 * 1. Plan and section have a cut.
 * 2. Elevation has none.
 */
export function test_unit_engine_drawing_has_cut(): void {
  TestValidator.predicate(
    "plan and section cut",
    autoMovieDrawingHasCut("plan") && autoMovieDrawingHasCut("section"),
  );
  TestValidator.predicate(
    "elevation does not",
    !autoMovieDrawingHasCut("elevation"),
  );
}
