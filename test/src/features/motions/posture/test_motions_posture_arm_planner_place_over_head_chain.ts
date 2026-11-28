import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problem a chain set from behind over a seated
 * partner's head, both arms, whose sampling planner exhausted its iterations,
 * stored once (`armPlanner/placeOverHeadChain.json`, `armPlannerFixture`) and
 * solved once.
 *
 * Scenarios:
 *
 * 1. The solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance, and the played arms C2 across every knot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes two-arm chain placement from behind a seated partner around the stored obstacles.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the saved chain case once through the planner and measures both arms as played.
 * @evidence contracts/development/testing.md#independent-expectations Independent authored hold discs, rig limits at 5 ms samples, obstacle clearance and knot derivatives judge the actual overhead path.
 */
export async function test_motions_posture_arm_planner_place_over_head_chain(): Promise<void> {
  TestValidator.equals(
    "planned within the planner's contracts",
    await armPlannerFixture.planned("placeOverHeadChain"),
    [],
  );
}
