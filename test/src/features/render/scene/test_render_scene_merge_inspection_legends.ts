import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";
import { AutoMovieRenderInspectionMarks } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `mergeInspectionLegends` adds the counts of entries that share a
 * label and colour, in first-seen order, and refuses a label given two
 * colours.
 *
 * Scenarios:
 *
 * 1. [edge 2, defect 1] and [edge 3] give [edge 5, defect 1] without changing the
 *    inputs.
 * 2. "edge" in red and in blue is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe the input legend counts, first-seen order, and conflicting colors.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that merging preserves first-seen order and the original inputs, sums repeated labels, and refuses one label with distinct colors.
 * @evidence contracts/development/testing.md#independent-expectations Adds the fixture's edge counts 2 and 3 to expect 5, keeps defect count 1, and uses explicit red and blue for the refusal.
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
