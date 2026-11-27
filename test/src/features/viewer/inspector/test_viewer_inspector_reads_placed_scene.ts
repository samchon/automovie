import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  readsInspectorPlacedScene
} from "../../../../../packages/viewer/src/inspector/internal/readsInspectorPlacedScene";
import { TestValidator } from "@nestia/e2e";

/**
 * `readsInspectorPlacedScene` is true for a subject that observes its
 * placed scene or draws render-target work before each picture.
 *
 * Scenarios:
 *
 * 1. A subject with neither reader is false.
 * 2. A subject with `beforeDraw` is true.
 * 3. A subject with `inspectPlaced` is true.
 */
export function test_viewer_inspector_reads_placed_scene(): void {
  TestValidator.equals("neither", readsInspectorPlacedScene({}), false);
  TestValidator.equals(
    "before draw",
    readsInspectorPlacedScene({ beforeDraw: (): void => {} }),
    true,
  );
  TestValidator.equals(
    "inspect placed",
    readsInspectorPlacedScene({
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