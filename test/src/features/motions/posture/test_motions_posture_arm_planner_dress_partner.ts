import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problem a hat set on a kneeling partner, whose hold
 * instant's inverse kinematics failed from every seed, stored once
 * (`armPlanner/dressPartner.json`, `armPlannerFixture`) and solved once.
 *
 * Scenarios:
 *
 * 1. The solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance, and the played arms C2 across every knot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the timed hat placement fixture whose initial hold fit fails across all seeds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the original kneeling-partner problem once through the arm planner and measures the resulting played configuration.
 * @evidence contracts/development/testing.md#independent-expectations The authored hat-contact sites, independent sampled joint ranges and boundary derivative continuity define success even when the initial fit fails.
 */
export async function test_motions_posture_arm_planner_dress_partner(): Promise<void> {
  TestValidator.equals(
    "planned within the planner's contracts",
    await armPlannerFixture.planned("dressPartner"),
    [],
  );
}
