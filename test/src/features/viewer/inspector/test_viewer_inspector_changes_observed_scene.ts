import { parseAutoMovieInspectionRequest } from "@automovie/render";
import { changesAutoMovieObservedScene } from "@automovie/viewer/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `changesAutoMovieObservedScene` is true when an inspection changes the scene
 * an observer would read.
 *
 * Scenarios:
 *
 * 1. The absent inspection, and one that changes only stroke or reach, do not.
 * 2. A part or hide pattern, a mark, a trail, a colour, a section, another
 *    shade and a surface switched off each do.
 */
export function test_viewer_inspector_changes_observed_scene(): void {
  const inspection = (
    entries: [string, string][],
  ): ReturnType<typeof parseAutoMovieInspectionRequest> => {
    const values: Map<string, string> = new Map<string, string>(entries);
    return parseAutoMovieInspectionRequest((key: string): string | undefined =>
      values.get(key),
    );
  };
  for (const entries of [[], [["stroke", "5"]], [["reach", "2"]]] satisfies [
    string,
    string,
  ][][])
    TestValidator.equals(
      JSON.stringify(entries),
      changesAutoMovieObservedScene(inspection(entries)),
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
      changesAutoMovieObservedScene(inspection(entries)),
      true,
    );
}