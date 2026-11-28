import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problem the small woman tipping a hat, whose sampling
 * planner exhausted its iterations, stored once (`armPlanner/tipHatSmall.json`,
 * `armPlannerFixture`) and solved once.
 *
 * Scenarios:
 *
 * 1. The solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance, and the played arms C2 across every knot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the stored compact-rig hat tip whose earlier sampler reached its search limit.
 * @evidence contracts/development/testing.md#behavioral-verification Solves once on that fixture and observes contact placement, dense ranges and C2 playback.
 * @evidence contracts/development/testing.md#independent-expectations The contact-site disc and rig limits are fixture inputs. The emitted trajectory is checked against those inputs instead of relying on the planner's success alone.
 */
export async function test_motions_posture_arm_planner_tip_hat_small(): Promise<void> {
  TestValidator.equals(
    "planned within the planner's contracts",
    await armPlannerFixture.planned("tipHatSmall"),
    [],
  );
}
