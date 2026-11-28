import type { IAutoMovieMotionHumanPianoPedal } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  pianoPedalStroke
} from "../../../../../packages/motions/src/handling/internal/pianoPedalStroke";
import { TestValidator } from "@nestia/e2e";

/**
 * `pianoPedalStroke`, the stroke clock of `pianoPedal.plan`: the strokes it
 * admits, and the pedal's travel fraction at each instant.
 *
 * Strokes over 3 s: 0.5 → 1 down, held to 1.5, up by 2; then 2.25 → 2.5 down
 * and straight back up by 2.75.
 *
 * Scenarios:
 *
 * 1. The pedal is up before and between strokes and at each stroke's start, fully
 *    down from `at` to `release`, and halfway at the middle of the press and of
 *    the release, where the minimum-jerk share of 1/2 is 1/2.
 * 2. No stroke is refused on `duration`; a stroke starting before the previous one
 *    ends, and one ending at the duration, are refused on `presses`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines timed depression, hold and release phases and nonoverlapping interior stroke admission.
 * @evidence contracts/development/testing.md#behavioral-verification Reads two different strokes before, during and after motion, then tries empty, overlapping and terminal-ending schedules.
 * @evidence contracts/development/testing.md#independent-expectations Minimum-jerk midpoints give half travel. The authored bounded intervals define zeros between strokes and a full pedal during the explicit hold.
 */
export function test_motions_handling_piano_pedal(): void {
  const presses: IAutoMovieMotionHumanPianoPedal.IPress[] = [
    { from: 0.5, at: 1, release: 1.5, to: 2 },
    { from: 2.25, at: 2.5, release: 2.5, to: 2.75 },
  ];
  TestValidator.equals(
    "the pedal's travel through the strokes",
    [0.25, 0.5, 0.75, 1.25, 1.75, 2.1, 2.5, 2.9].map(
      (seconds: number): number => pianoPedalStroke.travel(presses, seconds),
    ),
    [0, 0, 0.5, 1, 0.5, 0, 1, 0],
  );
  const refused = (
    strokes: IAutoMovieMotionHumanPianoPedal.IPress[],
    duration: number,
  ): AutoMovieMotionHumanRefusal["axis"] | undefined => {
    try {
      pianoPedalStroke.admit(strokes, duration);
      return undefined;
    } catch (error: unknown) {
      return error instanceof AutoMovieMotionHumanRefusal ? error.axis : undefined;
    }
  };
  TestValidator.equals(
    "an empty, overlapping or unbounded clock is refused",
    [
      refused(presses, 3),
      refused([], 3),
      refused([presses[0]!, { from: 1.9, at: 2.1, release: 2.2, to: 2.4 }], 3),
      refused([presses[0]!], 2),
    ],
    [undefined, "duration", "presses", "presses"],
  );
}
