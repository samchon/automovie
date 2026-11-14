import { motionArmClearing } from "../internal/motionArmClearing";
import { motionComplaints } from "../internal/motionComplaints";

/**
 * A forearm's clearing (`HumanArmClearance.cleared`) on the large man in the
 * quiet stance, split from `test_human_motion_posture_arm_clearance`, which
 * reads the overshoot it clears. `motionArmClearing` states the cells and the
 * 2 scenarios with their bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Clears real arms of a real body and reads the displayed room before and after through the public functions; a clearing that turns another joint, leaves its range, worsens the room or stops short of a reachable clear arm fails with its cell.
 * @evidence contracts/development/testing.md#independent-expectations The reachability of a clearing is decided by a grid search the function does not do; the other bounds are the function's documented promises.
 * @evidence contracts/development/testing.md#distinguishing-cases Both arms of the large man, the hanging arm turned both ways, a flexed arm and an arm raised into a partner; the other bodies of `motionHumanBody.EXTREMES` are the other `test_human_motion_posture_arm_clearing_*` specs, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership In memory on in-process bodies; the grid search runs many forward kinematic passes. The test program discovers every `test_` function under `features`, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the cells and scenarios are stated and the split.
 */
export function test_human_motion_posture_arm_clearing_m_large(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionArmClearing(complaints, "m-large");
  complaints.assert("every forearm is cleared as documented");
}
