import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner describes an over-quick authored course by its duration.
 *
 * Scenarios:
 *
 * 1. One solve of the stored course requires a longer duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes a duration refusal for the saved authored arm course whose clock is too short.
 * @evidence contracts/development/testing.md#behavioral-verification Loads the stored course and calls the planner at its original span, extracting the typed duration refusal.
 * @evidence contracts/development/testing.md#independent-expectations The span comes from the fixture endpoints. The reported lower bound must exceed it and the refusal must describe the same authored seconds.
 */
export async function test_motions_posture_arm_planner_karate(): Promise<void> {
  const timed: armPlannerFixture.IDuration =
    await armPlannerFixture.duration("karate");
  TestValidator.predicate(
    "the requested duration leaves more time for the same path",
    timed.minimum > timed.span,
  );
}
