import type { HumanArmTrajectory } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problems its laws once refused, each stored once under
 * `armPlanner/` with the other bodies' colliders inside the arms' reach
 * envelope (`armPlannerFixture`), one per cause:
 *
 * - The sampling planner exhausting its iterations: the tip of a hat on the
 *   average man and the small woman, the chain set over a seated partner's
 *   head, an embrace from behind.
 * - The hold instant's inverse kinematics failing from every seed: a hat set on a
 *   kneeling partner, the ribbon set over a seated partner's head, a ring
 *   slipped onto a partner's finger.
 * - The optimiser converging infeasible: the karate punches, the crutch user's
 *   sit.
 *
 * Scenarios, each problem's:
 *
 * 1. The solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance, and the played arms C2 across every knot.
 */
export async function test_unit_motions_posture_arm_planner_refusals(): Promise<void> {
  const failures: string[] = [];
  for (const name of [
    "tipHatAverage",
    "tipHatSmall",
    "placeOverHeadChain",
    "embraceFromBehind",
    "dressPartner",
    "placeOverHeadRibbon",
    "slipRing",
    "karate",
    "crutchSit",
  ]) {
    const loaded: armPlannerFixture.ILoaded =
      await armPlannerFixture.load(name);
    let solved: HumanArmTrajectory.ISolved | undefined;
    try {
      solved = armPlannerFixture.solve(loaded);
    } catch (error: unknown) {
      failures.push(`${name}: ${String(error)}`);
    }
    if (solved !== undefined)
      for (const broken of armPlannerFixture.broken(loaded, solved))
        failures.push(`${name}: ${broken}`);
  }
  TestValidator.equals("every stored problem planned", failures, []);
}
