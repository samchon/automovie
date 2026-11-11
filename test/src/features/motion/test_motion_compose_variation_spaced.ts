import {
  AutoMovieMotionHumanVariationDraw,
  AutoMovieMotionHumanVariationForm,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionVariationSource } from "../internal/motionVariationSource";

/**
 * Consecutive repeats of an action land apart, and many repeats fill the
 * range evenly.
 *
 * A one-component slot steps by the inverse golden ratio, 0.618, so two
 * consecutive uniforms are 0.382 apart around the circle. The slot read is a
 * preset bend, whose novice spread is 0.05 and whose bound of 0.1 does not
 * shrink it.
 *
 * Scenarios:
 * 1. Over 64 consecutive repeats, two neighbours' uniforms are always 0.382
 *    apart around the circle.
 * 2. Over the same repeats, two neighbours' bends differ by at least 0.045,
 *    0.9 of one spread: 0.382 of the truncated normal's mass is never
 *    narrower than 0.96 spreads.
 * 3. Of 64 repeats' uniforms, each of 8 equal bins holds 7 to 9: a seeded
 *    stream read once per repeat would leave some bin with 3 or 13.
 * 4. A two-component slot's 64 points put 2 to 6 in each cell of a 4 by 4
 *    grid.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public sampling function and one slot over consecutive repeats; a fresh draw per repeat, a wrong step, or a repeat index that is not read fails.
 * @evidence contracts/development/testing.md#independent-expectations The circle distance is 1 minus the inverse golden ratio; the bin counts are the three-distance theorem's bound for 64 points of that step in bins of 1/8, and the grid's counts the recurrence's known evenness, both stated as numbers.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the step itself, its effect on a slot's value, and the evenness in one and in two components.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on real seeded streams. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the step, the slot and lists the 4 scenarios with their numbers.
 */
export function test_motion_compose_variation_spaced(): void {
  const COUNT: number = 64;
  const draws = (index: number, count: 1 | 2): number[] =>
    AutoMovieMotionHumanVariationDraw.uniforms(
      motionVariationSource({ index }).series("slot"),
      count,
    );
  const ones: number[] = Array.from(
    { length: COUNT },
    (_: unknown, index: number): number => draws(index, 1)[0]!,
  );
  const around = (a: number, b: number): number =>
    Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
  TestValidator.predicate(
    "neighbours are 0.382 apart around the circle",
    ones
      .slice(1)
      .every(
        (u: number, i: number): boolean =>
          Math.abs(around(u, ones[i]!) - 0.3819660112501051) <= 1e-9,
      ),
  );

  const bends: number[] = Array.from(
    { length: COUNT },
    (_: unknown, index: number): number =>
      AutoMovieMotionHumanVariationForm.bend(
        motionVariationSource({ index }),
        "slot",
        0,
      ),
  );
  TestValidator.predicate(
    "neighbouring repeats differ by 0.9 of a spread",
    bends
      .slice(1)
      .every(
        (v: number, i: number): boolean => Math.abs(v - bends[i]!) >= 0.045,
      ),
  );

  const bins: number[] = new Array<number>(8).fill(0);
  for (const u of ones) ++bins[Math.floor(u * 8)]!;
  TestValidator.predicate(
    "one component fills eight bins evenly",
    bins.every((n: number): boolean => n >= 7 && n <= 9),
  );

  const cells: number[] = new Array<number>(16).fill(0);
  for (let index: number = 0; index < COUNT; ++index) {
    const [u, v] = draws(index, 2) as [number, number];
    ++cells[Math.floor(u * 4) * 4 + Math.floor(v * 4)]!;
  }
  TestValidator.predicate(
    "two components fill a 4 by 4 grid evenly",
    cells.every((n: number): boolean => n >= 2 && n <= 6),
  );
}
