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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both callbacks that depend on the placed scene and the case without either.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the predicate with three in-memory subject records, each providing zero or one of the relevant callbacks.
 * @evidence contracts/development/testing.md#independent-expectations The callback properties are directly present in the supplied objects. Either callback requires the placed scene, while the empty object has neither requirement.
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