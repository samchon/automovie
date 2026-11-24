import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { crutchWalkScene } from "../../internal/crutchWalkScene";

/**
 * A swing-to walk on two crutches turning about its entry station, on its own:
 * scenario 4 of `test_motion_gait_crutch_walk`, on the average man as the
 * original, two stations turning 10 then 20 degrees left, entered standing in
 * the tripod (the walk is one action).
 *
 * Scenarios:
 *
 * 1. At every landing each crutch keeps its entry distance and bearing from the
 *    walker's station, carried rigidly by the station's displacement and turn,
 *    within 2 mm and 0.1 degree.
 * 2. The walk keeps the shipped bounds over its own span.
 *
 * Decomposes the original's check 4; the original reads no verdict of the
 * turning walk, which this unit adds. It ran there only after every straight
 * cell passed, and none did.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's scenario, the entry, the body and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the crutches' displayed frames at the entry and at each landing and the verdict report over the walk's span; a crutch left behind, turned or swung away from the walker or a finding in the walk fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected place is the rigid carry of each crutch's entry offset by the authored station's displacement and turn; the bounds are the original's 2 mm and 0.1 degree.
 * @evidence contracts/development/testing.md#distinguishing-cases A turning walk against the straight ones of the gait units; the swing-to gait's own checks are `test_motion_gait_crutch_walk_swing_to`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_crutch_walk_turning`.
 */
export function test_motion_gait_crutch_walk_turning(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    crutchWalkScene.turning(checks, motionHumanBody("m-average"));
  } catch (error: unknown) {
    checks.check(
      `turning: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
  checks.assert("a turning crutch walk carries its crutches with the walker");
}
