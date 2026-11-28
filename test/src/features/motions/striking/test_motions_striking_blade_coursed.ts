import {
  StrikingBladeCoursed
} from "../../../../../packages/motions/src/striking/internal/StrikingBladeCoursed";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A coursed blade stroke's pace (`StrikingBladeCoursed.pace`): a minimum-jerk
 * travel peaks at 15 / 8 of its mean speed.
 *
 * Scenario: 0.4 m in 0.5 s peaks at 1.5 m/s; with no time it has no pace.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines peak animation speed for a minimum-jerk path and zero pace when no time is available.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the pace helper for 0.4 m over 0.5 s and again at zero duration.
 * @evidence contracts/development/testing.md#independent-expectations The derivative peaks at 15/8 of normalized mean speed, which gives 1.5 m/s for the declared path.
 */
export function test_motions_striking_blade_coursed(): void {
  TestValidator.predicate(
    "the peak",
    nclose(StrikingBladeCoursed.pace(0.4, 0.5), 1.5, 1e-12) &&
      StrikingBladeCoursed.pace(0.4, 0) === 0,
  );
}
