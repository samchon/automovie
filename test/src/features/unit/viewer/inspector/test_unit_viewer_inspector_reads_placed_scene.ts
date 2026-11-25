import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import { readsAutoMovieInspectorPlacedScene } from "@automovie/viewer/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `readsAutoMovieInspectorPlacedScene` is true for a subject that observes its
 * placed scene or draws render-target work before each picture.
 *
 * Scenarios:
 *
 * 1. A subject with neither reader is false.
 * 2. A subject with `beforeDraw` is true.
 * 3. A subject with `inspectPlaced` is true.
 */
export function test_unit_viewer_inspector_reads_placed_scene(): void {
  TestValidator.equals("neither", readsAutoMovieInspectorPlacedScene({}), false);
  TestValidator.equals(
    "before draw",
    readsAutoMovieInspectorPlacedScene({ beforeDraw: (): void => {} }),
    true,
  );
  TestValidator.equals(
    "inspect placed",
    readsAutoMovieInspectorPlacedScene({
      inspectPlaced: (): IAutoMovieInspectionDiagnostics => ({
        scope: "s",
        time: { filmSeconds: 0 },
        findings: [],
        coverage: [],
      }),
    }),
    true,
  );
}