import { motionArmClearing } from "../internal/motionArmClearing";
import { motionComplaints } from "../internal/motionComplaints";
import type { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Forearm clearing preserves joint freedom and keeps obstacles outside the arm.
 *
 * Scenarios:
 * 1. An arm already within its allowance is kept.
 * 2. An obstructed arm changes only upper-arm abduction and elbow flexion. An
 *    independent feasible candidate exposes any remaining avoidable overlap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the retained joint coordinates and the two clearance branches.
 * @evidence contracts/development/testing.md#behavioral-verification Clears real arms on both sides of opposite stature extremes, verifies unchanged coordinates and joint range, and measures the remaining overshoot.
 * @evidence contracts/development/testing.md#independent-expectations The documented range and residual limits are unchanged. An independent grid is only needed after a residual that could have been avoided.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves the twist and adduction corners, a flexed elbow and a second performer's obstacle for both arms.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test owns the actual rigs and bounds all candidate evaluations to its shared per-arm geometry and range.
 */
export function test_human_motion_posture_arm_clearing(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const body of BODIES) motionArmClearing(complaints, body);
  complaints.assert("Each forearm achieves its feasible clearance within its two freedoms");
}

/** The bodies at the opposite stature limits. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];
