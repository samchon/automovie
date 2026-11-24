import { prepareSupportLiftCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a quintic's evaluation, metres. */
const ROUNDING: number = 1e-12;

/** The bump's height, metres: the 11 mm a held leg once sank by. */
const BUMP: number = 0.011;

/**
 * `prepareSupportLiftCourse` fits a support interval's root lift exactly at
 * every knot of the frame grid and reads it between them from the shared knot
 * course.
 *
 * Scenarios, a grid of eighths:
 *
 * 1. A lift that rises 11 mm at a quarter and falls back by the middle (`0.011
 *    sin^2(2 pi s)`, zero at 0, 0.5 and 1) reads its full 11 mm at the quarter:
 *    a tessellation judged only at middles read none there.
 * 2. Every grid knot reads its exact lift.
 * 3. Shares outside the interval read its ends.
 */
export function test_unit_motions_actions_prepare_support_lift_course(): void {
  const exact: (s: number) => number = (s: number): number => BUMP * Math.sin(2 * Math.PI * s) ** 2;
  const course: prepareSupportLiftCourse.ICourse = prepareSupportLiftCourse(
    1 / 8,
    exact,
  );
  TestValidator.predicate(
    "the bump at the quarter",
    nclose(course.read(0.25), BUMP, ROUNDING),
  );
  TestValidator.predicate(
    "exact at the knots",
    Array.from({ length: 9 }, (_: unknown, k: number): number => k / 8).every(
      (s: number): boolean => nclose(course.read(s), exact(s), ROUNDING),
    ),
  );
  TestValidator.predicate(
    "held outside",
    nclose(course.read(-1), exact(0), ROUNDING) &&
      nclose(course.read(2), exact(1), ROUNDING),
  );
}
