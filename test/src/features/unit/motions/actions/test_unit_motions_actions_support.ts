import { prepareSupportLiftCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_prepare_support_lift_course {
  /** Rounding of a quintic's evaluation, metres. */
  const ROUNDING: number = 1e-12;

  /** The bump's height, metres: the 11 mm a held leg once sank by. */
  const BUMP: number = 0.011;

  /** The lift's tolerance, metres: the limb solver's millimetre. */
  const TOLERANCE: number = 1e-3;

  /**
   * `prepareSupportLiftCourse` fits a support interval's root lift exactly at
   * knots AutoKnots places over the share, no finer than one frame of the grid,
   * and reads it between them from the shared knot course.
   *
   * Scenarios, a grid of 64ths:
   *
   * 1. A lift that rises 11 mm at a quarter and falls back by the middle (`0.011
   *    sin^2(2 pi s)`, zero at 0, 0.5 and 1) reads within the millimetre of its
   *    full 11 mm at the quarter: a tessellation judged only at middles read none
   *    there.
   * 2. Every share the lift was fitted at reads its exact lift, both ends among
   *    them.
   * 3. Shares outside the interval read its ends.
   */
  export function run(): void {
    const fitted: number[] = [];
    const exact: (s: number) => number = (s: number): number => {
      fitted.push(s);
      return BUMP * Math.sin(2 * Math.PI * s) ** 2;
    };
    const course: prepareSupportLiftCourse.ICourse = prepareSupportLiftCourse(
      1 / 64,
      exact,
    );
    const lift: (s: number) => number = (s: number): number =>
      BUMP * Math.sin(2 * Math.PI * s) ** 2;
    TestValidator.predicate(
      "the bump at the quarter",
      Math.abs(course.read(0.25) - BUMP) <= TOLERANCE,
    );
    TestValidator.predicate(
      "exact where fitted",
      fitted.includes(0) &&
        fitted.includes(1) &&
        fitted.every((s: number): boolean =>
          nclose(course.read(s), lift(s), ROUNDING),
        ),
    );
    TestValidator.predicate(
      "held outside",
      nclose(course.read(-1), 0, ROUNDING) &&
        nclose(course.read(2), lift(1), ROUNDING),
    );
  }
}

/**
 * `support`'s unit contract: its lifted foot course.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `prepare_support_lift_course`: `prepareSupportLiftCourse` fits a support
 *   interval's root lift exactly at knots AutoKnots places over the share, no
 *   finer than one frame of the grid, and reads it between them from the shared
 *   knot course.
 */
export async function test_unit_motions_actions_support(): Promise<void> {
  part_prepare_support_lift_course.run();
}
