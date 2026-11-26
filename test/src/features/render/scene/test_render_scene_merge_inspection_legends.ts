import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";
import { AutoMovieRenderInspectionMarks } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `mergeAutoMovieInspectionLegends` adds the counts of entries that share a
 * label and colour, in first-seen order, and refuses a label given two
 * colours.
 *
 * Scenarios:
 *
 * 1. [edge 2, defect 1] and [edge 3] give [edge 5, defect 1] without changing the
 *    inputs.
 * 2. "edge" in red and in blue is refused.
 */
export function test_render_scene_merge_inspection_legends(): void {
  const first: IAutoMovieInspectionLegendEntry[] = [
    { label: "edge", color: 0xff0000, count: 2 },
    { label: "defect", color: 0x00ff00, count: 1 },
  ];
  TestValidator.equals(
    "merged",
    [
      AutoMovieRenderInspectionMarks.mergeLegends([
        first,
        [{ label: "edge", color: 0xff0000, count: 3 }],
      ]),
      first[0]!.count,
    ],
    [
      [
        { label: "edge", color: 0xff0000, count: 5 },
        { label: "defect", color: 0x00ff00, count: 1 },
      ],
      2,
    ],
  );
  TestValidator.error("two colours", (): unknown =>
    AutoMovieRenderInspectionMarks.mergeLegends([
      [{ label: "edge", color: 0xff0000, count: 1 }],
      [{ label: "edge", color: 0x0000ff, count: 1 }],
    ]),
  );
}
