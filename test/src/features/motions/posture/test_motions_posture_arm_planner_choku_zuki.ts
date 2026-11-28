import type {
  HumanArmTrajectory
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectory";
import { TestValidator } from "@nestia/e2e";

import { armPlannerFixture } from "../../internal/armPlanner/armPlannerFixture";

/**
 * The arm planner on the problem choku-zuki hands it, stored once
 * (`armPlanner/chokuZuki.json`): the average man's left arm over the 2.2 s
 * action, its 35 knots, the 67 instants of its frame grid with the trunk's pose
 * at each, the hand's site and its 10 mm disc over the punch, the rest, the
 * law's goal arm and the laid course's hold. The course laid from that hold is
 * refused for its sweep, so the planner itself must find the path: the seed,
 * the SQP and the refinement on the knots. Its result is then read on the
 * played arm independently of the solve's own verdict
 * (`armPlannerFixture.broken`).
 *
 * Scenarios:
 *
 * 1. The laid course is refused for its sweep (the problem reaches the solve), and
 *    the solve admits a trajectory, raising no refusal.
 * 2. Every hold frame's hand lies within its site's disc, every instant every 5 ms
 *    within the joints' ranges, the model's reading of the played grid within
 *    its tolerance (nothing interpenetrates), and the played arm C2 across
 *    every knot.
 * 3. Solving the same problem again gives the same solution, bit for bit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes recovery from a refused authored sweep using the actual stored animated arm problem.
 * @evidence contracts/development/testing.md#behavioral-verification Checks the laid course refusal, solves the typed 2.2 s fixture and measures the played arm, then repeats the solver on the same input.
 * @evidence contracts/development/testing.md#independent-expectations The authored contact disc, rig ranges and played-grid tolerance bound the solution. Derivative continuity is measured at every knot and repeated solutions must match bit for bit.
 */
export async function test_motions_posture_arm_planner_choku_zuki(): Promise<void> {
  const loaded: armPlannerFixture.ILoaded =
    await armPlannerFixture.load("chokuZuki");
  TestValidator.equals(
    "the laid course's refusal",
    loaded.laid()?.refused,
    "swept",
  );
  let solved: HumanArmTrajectory.ISolved | undefined;
  let refusal: string = "";
  try {
    solved = armPlannerFixture.solve(loaded);
  } catch (error: unknown) {
    refusal = String(error);
  }
  TestValidator.equals("the solve admits a trajectory", refusal, "");
  if (solved === undefined) return;
  TestValidator.equals(
    "the planner's contracts",
    armPlannerFixture.broken(loaded, solved),
    [],
  );
  TestValidator.equals(
    "the same solution again",
    armPlannerFixture.solve(loaded).state,
    solved.state,
  );
}
