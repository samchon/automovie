import type { IAutoMovieMotionHumanInterruptRow } from "@automovie/interface";
import { AutoMovieMotionHumanInterrupt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanInterrupt` names a cancel row by its window and blend:
 * `anytime` is the whole phrase, `fromStroke`, `fromStrokeEnd` and `fromRelax`
 * run from that instant to the end; the blends are 0.08, 0.1, 0.15 and 0.3 s; a
 * row is an inertialized cut entering the next action at its start, and a table
 * gives each next action one such row.
 *
 * Scenarios:
 *
 * 1. Each window opens where it names.
 * 2. Each blend is its seconds, the row inertialized at entry 0.
 * 3. A table of a walk from the stroke, smoothly, and anything deliberately.
 */
export function test_unit_motions_compose_interrupt(): void {
  // 1. Windows.
  TestValidator.equals(
    "the windows",
    AutoMovieMotionHumanInterrupt.WINDOWS.map(
      (
        w: (typeof AutoMovieMotionHumanInterrupt.WINDOWS)[number],
      ): readonly (number | string)[] =>
        AutoMovieMotionHumanInterrupt.row(w, "quick").window,
    ),
    [
      [0, 1],
      ["stroke", 1],
      ["strokeEnd", 1],
      ["relax", 1],
    ],
  );

  // 2. Blends.
  TestValidator.equals(
    "the blends, inertialized at entry",
    AutoMovieMotionHumanInterrupt.BLEND_NAMES.map(
      (
        b: (typeof AutoMovieMotionHumanInterrupt.BLEND_NAMES)[number],
      ): readonly unknown[] => {
        const row: IAutoMovieMotionHumanInterruptRow =
          AutoMovieMotionHumanInterrupt.row("anytime", b);
        return [row.blend, row.kind, row.entry];
      },
    ),
    [
      [0.08, "inertialize", 0],
      [0.1, "inertialize", 0],
      [0.15, "inertialize", 0],
      [0.3, "inertialize", 0],
    ],
  );

  // 3. A table.
  TestValidator.equals(
    "one row per next action",
    AutoMovieMotionHumanInterrupt.table({
      walk: ["fromStroke", "smooth"],
      any: ["anytime", "deliberate"],
    }),
    {
      walk: [
        { window: ["stroke", 1], kind: "inertialize", entry: 0, blend: 0.15 },
      ],
      any: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    },
  );
}
