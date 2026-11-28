import { AutoMovieRenderInspectionRequest } from "@automovie/render";
import {
  changesObservedScene
} from "../../../../../packages/viewer/src/inspector/internal/changesObservedScene";
import { TestValidator } from "@nestia/e2e";

/**
 * `changesObservedScene` is true when an inspection changes the scene
 * an observer would read.
 *
 * Scenarios:
 *
 * 1. The absent inspection, and one that changes only stroke or reach, do not.
 * 2. A part or hide pattern, a mark, a trail, a colour, a section, another
 *    shade and a surface switched off each do.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene-changing options and the style or reach cases that leave an observed scene unchanged.
 * @evidence contracts/development/testing.md#behavioral-verification Parses literal inspection options, enables one option per case and calls the scene-change predicate on each typed request.
 * @evidence contracts/development/testing.md#independent-expectations Style and reach affect an existing display instruction alone. The chosen subset, hiding, glyph, trail, material, section, pass and surface options can change the scene the observer reads.
 */
export function test_viewer_inspector_changes_observed_scene(): void {
  const inspection = (
    entries: [string, string][],
  ): ReturnType<typeof AutoMovieRenderInspectionRequest.parseRequest> => {
    const values: Map<string, string> = new Map<string, string>(entries);
    return AutoMovieRenderInspectionRequest.parseRequest((key: string): string | undefined =>
      values.get(key),
    );
  };
  for (const entries of [[], [["stroke", "5"]], [["reach", "2"]]] satisfies [
    string,
    string,
  ][][])
    TestValidator.equals(
      JSON.stringify(entries),
      changesObservedScene(inspection(entries)),
      false,
    );
  for (const entries of [
    [["parts", "hero"]],
    [["hide", "hero"]],
    [["marks", "defect"]],
    [["trail", "hero"]],
    [["color", "hero=ff0000"]],
    [["section", "x:0.2"]],
    [["shade", "depth"]],
    [["surface", "0"]],
  ] satisfies [string, string][][])
    TestValidator.equals(
      JSON.stringify(entries),
      changesObservedScene(inspection(entries)),
      true,
    );
}