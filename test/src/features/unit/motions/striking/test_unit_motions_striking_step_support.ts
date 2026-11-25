import { strikingStepSupport } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A strike cut from a step lands its swinging foot
 * (`strikingStepSupport.settle`): the foot's height above its landing lowers on
 * a minimum-jerk share until the touchdown.
 *
 * Scenario: 0.1 m up with a touchdown at 0.4 s, it hangs 0.1 m at the cut, 0.05
 * m at 0.2 s, and none at 0.4 s and after.
 */
export function test_unit_motions_striking_step_support(): void {
  TestValidator.predicate(
    "the landing",
    nclose(strikingStepSupport.settle(0.1, 0, 0.4), 0.1, 1e-12) &&
      nclose(strikingStepSupport.settle(0.1, 0.2, 0.4), 0.05, 1e-12) &&
      strikingStepSupport.settle(0.1, 0.4, 0.4) === 0 &&
      strikingStepSupport.settle(0.1, 1, 0.4) === 0,
  );
}
