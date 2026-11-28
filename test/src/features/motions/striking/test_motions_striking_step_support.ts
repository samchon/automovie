import {
  strikingStepSupport
} from "../../../../../packages/motions/src/striking/internal/strikingStepSupport";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A strike cut from a step lands its swinging foot
 * (`strikingStepSupport.settle`): the foot's height above its landing lowers on
 * a minimum-jerk share until the touchdown.
 *
 * Scenario: 0.1 m up with a touchdown at 0.4 s, it hangs 0.1 m at the cut, 0.05
 * m at 0.2 s, and none at 0.4 s and after.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the remaining virtual foot height through a minimum-jerk landing.
 * @evidence contracts/development/testing.md#behavioral-verification Samples a foot 0.1 m high from cut to after its declared 0.4 s touchdown.
 * @evidence contracts/development/testing.md#independent-expectations Quintic symmetry gives 0.1, 0.05 and 0 m at 0, 0.2 and 0.4 s. The terminal value stays zero.
 */
export function test_motions_striking_step_support(): void {
  TestValidator.predicate(
    "the landing",
    nclose(strikingStepSupport.settle(0.1, 0, 0.4), 0.1, 1e-12) &&
      nclose(strikingStepSupport.settle(0.1, 0.2, 0.4), 0.05, 1e-12) &&
      strikingStepSupport.settle(0.1, 0.4, 0.4) === 0 &&
      strikingStepSupport.settle(0.1, 1, 0.4) === 0,
  );
}
