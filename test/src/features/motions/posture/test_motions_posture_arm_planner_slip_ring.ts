import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problem a ring slipped onto a partner's finger, both
 * arms, whose hold instant's inverse kinematics failed from every seed, stored
 * once (`armPlanner/slipRing.json`, `armPlannerFixture`) and solved once.
 *
 * Scenarios:
 *
 * 1. The solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance, and the played arms C2 across every knot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the stored ring-placement problem and the need to solve both posed arms through its hold.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the planner once on the exact fixture and checks the resulting arm and hand playback.
 * @evidence contracts/development/testing.md#independent-expectations The declared finger site disc, articulated ranges at 5 ms intervals and derivative continuity provide bounds independent of the solve's success status.
 */
export async function test_motions_posture_arm_planner_slip_ring(): Promise<void> {
  TestValidator.equals(
    "planned within the planner's contracts",
    await armPlannerFixture.planned("slipRing"),
    [],
  );
}
