import { StrikingBladeCoursed } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A coursed blade stroke's pace (`StrikingBladeCoursed.pace`): a minimum-jerk
 * travel peaks at 15 / 8 of its mean speed.
 *
 * Scenario: 0.4 m in 0.5 s peaks at 1.5 m/s; with no time it has no pace.
 */
export function test_unit_motions_striking_blade_coursed(): void {
  TestValidator.predicate(
    "the peak",
    nclose(StrikingBladeCoursed.pace(0.4, 0.5), 1.5, 1e-12) &&
      StrikingBladeCoursed.pace(0.4, 0) === 0,
  );
}
