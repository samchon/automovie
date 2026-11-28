import type { IAutoMovieMark } from "@automovie/interface";
import { AutoMovieRenderInspectionPalette, AutoMovieRenderInspectionMarks } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `legendInspectionMarks` counts marks by kind, flagged ones apart.
 *
 * Scenarios:
 *
 * 1. Two plain and one flagged curve give the kind's entry with count 2 and a
 *    `(flagged)` entry in the flag colour with count 1.
 * 2. No marks give no entries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The examples specify how an ordinary group, flagged mark, and empty mark list appear in an inspection legend.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that ordinary and flagged marks of one kind produce separate counts and that an empty input produces no entries.
 * @evidence contracts/development/testing.md#independent-expectations Uses two ordinary curves and one flagged curve to require counts 2 and 1 and the separate flagged legend label.
 */
export function test_render_scene_legend_inspection_marks(): void {
  const mark = (flagged: boolean): IAutoMovieMark => ({
    path: "curve/0",
    kind: "curve",
    label: "Curve",
    color: 0x00ff00,
    shape: { type: "points", points: [0, 0, 0] },
    flagged,
    anchor: null,
  });
  const kinds: Map<string, { label: string; color: number }> = new Map([
    ["curve", { label: "Curve", color: 0x00ff00 }],
  ]);
  TestValidator.equals(
    "legend",
    AutoMovieRenderInspectionMarks.legend(
      [mark(false), mark(true), mark(false)],
      kinds,
    ),
    [
      { label: "Curve", color: 0x00ff00, count: 2 },
      {
        label: "Curve (flagged)",
        color: AutoMovieRenderInspectionPalette.flagged,
        count: 1,
      },
    ],
  );
  TestValidator.equals("none", AutoMovieRenderInspectionMarks.legend([], kinds), []);
}