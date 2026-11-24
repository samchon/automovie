import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionComposeTrunk } from "../../../../features/internal/motionComposeTrunk";
import type { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * The trunk crouch follows its clock, protects both plants and returns to its baseline.
 *
 * Scenarios:
 * 1. Zero, moderate, deep and pitched branches check published rise, hold and fall instants.
 * 2. Nonfinite and negative inputs refuse, and a joint-angle-only standing entry still maintains both planted feet.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the primitive and the independent conditions it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Reads hips, trunk and foot bones in each phase, and the support margin only in the explicitly balanced primitive.
 * @evidence contracts/development/testing.md#independent-expectations The commanded depth and pitch give the full-motion values. Both planted ball positions are constrained by the independent standing pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Joint targets and goal-free entry, independent tilt and depth, and both complementary clock edges.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario solves the posed geometry on in-memory rigs and gathers every finding before asserting.
 */
export function test_motion_posture_primitive_trunk_crouch(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const body of BODIES) motionComposeTrunk.crouch(body, complaints);
  complaints.assert(
    "The trunk crouch follows its clock, protects both plants and returns to its baseline",
  );
}

/** The short rig supplies one measured support and reach geometry. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small"];
