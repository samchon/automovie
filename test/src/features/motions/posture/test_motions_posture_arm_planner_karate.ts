import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner describes an over-quick authored course by its duration.
 *
 * Scenarios:
 *
 * 1. One solve of the stored course returns a longer, frame-aligned duration.
 */
export async function test_motions_posture_arm_planner_karate(): Promise<void> {
  const timed: armPlannerFixture.IDuration =
    await armPlannerFixture.duration("karate");
  TestValidator.predicate(
    "the requested duration leaves more time for the same path",
    timed.minimum > timed.span,
  );
}
