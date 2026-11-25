import type { IAutoMovieMark } from "@automovie/interface";
import {
  AUTO_MOVIE_INSPECTION_PALETTE,
  legendAutoMovieInspectionMarks,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `legendAutoMovieInspectionMarks` counts marks by kind, flagged ones apart.
 *
 * Scenarios:
 *
 * 1. Two plain and one flagged curve give the kind's entry with count 2 and a
 *    `(flagged)` entry in the flag colour with count 1.
 * 2. No marks give no entries.
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
    legendAutoMovieInspectionMarks(
      [mark(false), mark(true), mark(false)],
      kinds,
    ),
    [
      { label: "Curve", color: 0x00ff00, count: 2 },
      {
        label: "Curve (flagged)",
        color: AUTO_MOVIE_INSPECTION_PALETTE.flagged,
        count: 1,
      },
    ],
  );
  TestValidator.equals("none", legendAutoMovieInspectionMarks([], kinds), []);
}