import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner reports the required duration for the stored hat tip.
 *
 * Scenarios:
 *
 * 1. One solve rejects the authored clock with a longer duration in seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the duration request from a stored average-rig hat-tip problem at its original clock.
 * @evidence contracts/development/testing.md#behavioral-verification Solves once at the stored span and requires the typed duration-specific reach refusal.
 * @evidence contracts/development/testing.md#independent-expectations The authored grid endpoints fix the attempted span, and its refused value must match them. A usable minimum must strictly increase the duration.
 */
export async function test_motions_posture_arm_planner_tip_hat_average(): Promise<void> {
  const timed: armPlannerFixture.IDuration =
    await armPlannerFixture.duration("tipHatAverage");
  TestValidator.predicate(
    "the requested duration leaves more time for the same path",
    timed.minimum > timed.span,
  );
}
