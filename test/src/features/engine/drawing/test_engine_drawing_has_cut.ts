import { AutoMovieEngineDrawing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `drawingHasCut` says whether a projection cuts the model: a plan and
 * a section do, an elevation does not.
 *
 * Scenarios:
 *
 * 1. Plan and section have a cut.
 * 2. Elevation has none.
 */
export function test_engine_drawing_has_cut(): void {
  TestValidator.predicate(
    "plan and section cut",
    AutoMovieEngineDrawing.autoMovieDrawingHasCut("plan") &&
      AutoMovieEngineDrawing.autoMovieDrawingHasCut("section"),
  );
  TestValidator.predicate(
    "elevation does not",
    !AutoMovieEngineDrawing.autoMovieDrawingHasCut("elevation"),
  );
}
