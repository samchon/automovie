import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problem a ribbon set from in front over a seated
 * partner's head, both arms, whose hold instant's inverse kinematics failed
 * from every seed, stored once (`armPlanner/placeOverHeadRibbon.json`,
 * `armPlannerFixture`) and solved once.
 *
 * Scenarios:
 *
 * 1. The solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance, and the played arms C2 across every knot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes two-arm ribbon placement from in front using the fixture whose hold fit originally failed.
 * @evidence contracts/development/testing.md#behavioral-verification Plans once using the seated-partner ribbon geometry and checks resulting hold placement, ranges and displayed trajectory.
 * @evidence contracts/development/testing.md#independent-expectations The two site discs and measured C2 joins validate the achieved pose. Dense samples and played-grid tolerance expose a hold-only solution that collides in transit.
 */
export async function test_motions_posture_arm_planner_place_over_head_ribbon(): Promise<void> {
  TestValidator.equals(
    "planned within the planner's contracts",
    await armPlannerFixture.planned("placeOverHeadRibbon"),
    [],
  );
}
