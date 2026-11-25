import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner reports the required duration for the stored hat tip.
 *
 * Scenarios:
 *
 * 1. One solve rejects the authored clock with a longer duration in seconds.
 */
export async function test_motions_posture_arm_planner_tip_hat_average(): Promise<void> {
  const timed: armPlannerFixture.IDuration =
    await armPlannerFixture.duration("tipHatAverage");
  TestValidator.predicate(
    "the requested duration leaves more time for the same path",
    timed.minimum > timed.span,
  );
}
