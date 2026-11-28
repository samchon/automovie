import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problem an embrace from behind, whose sampling planner
 * exhausted its iterations, stored once (`armPlanner/embraceFromBehind.json`,
 * `armPlannerFixture`) and solved once.
 *
 * Scenarios:
 *
 * 1. The solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance, and the played arms C2 across every knot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the stored behind-partner embrace that previously exhausted its sampling search.
 * @evidence contracts/development/testing.md#behavioral-verification Solves that exact fixture through the arm planner and inspects its played hold frames, inter-frame ranges and knots.
 * @evidence contracts/development/testing.md#independent-expectations Authored contact discs and the stored obstruction fixtures require a feasible route; dense 5 ms range samples and derivative agreement check the returned path.
 */
export async function test_motions_posture_arm_planner_embrace_from_behind(): Promise<void> {
  TestValidator.equals(
    "planned within the planner's contracts",
    await armPlannerFixture.planned("embraceFromBehind"),
    [],
  );
}
