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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the plan and section as the cut projections and elevation as the non-cut projection.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Drawing.autoMovieDrawingHasCut with each of the three public projection literals.
 * @evidence contracts/development/testing.md#independent-expectations The architectural projection contract fixes the exact truth values: both plan and section intersect the model, and elevation only projects it.
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
