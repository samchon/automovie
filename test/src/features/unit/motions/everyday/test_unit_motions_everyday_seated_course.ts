import { seatedCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a product of decimal ratios. */
const ROUNDING: number = 1e-12;

/**
 * `seatedCourse` times a sit's descent and a rise's ascent as `2 (1 + 0.6 (1 -
 * r))` seconds and peaks their trunk flexion at `35 + 50 (1 - r)` degrees, `r`
 * the seat's height over the popliteal height.
 *
 * Scenarios:
 *
 * 1. A seat at the popliteal height takes 2 s and flexes the trunk 35 degrees.
 * 2. A seat at 0.6 of it takes 2.48 s and flexes 55; one at 1.2 takes 1.76 s and
 *    flexes 25.
 */
export function test_unit_motions_everyday_seated_course(): void {
  TestValidator.predicate(
    "the course",
    nclose(seatedCourse.descent(1), 2, ROUNDING) &&
      nclose(seatedCourse.flexion(1), 35, ROUNDING) &&
      nclose(seatedCourse.descent(0.6), 2.48, ROUNDING) &&
      nclose(seatedCourse.flexion(0.6), 55, ROUNDING) &&
      nclose(seatedCourse.descent(1.2), 1.76, ROUNDING) &&
      nclose(seatedCourse.flexion(1.2), 25, ROUNDING),
  );
}
