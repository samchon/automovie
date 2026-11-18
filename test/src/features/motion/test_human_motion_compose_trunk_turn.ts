import { motionComplaints } from "../internal/motionComplaints";
import { motionComposeTrunk } from "../internal/motionComposeTrunk";
import type { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A trunk turn and sink preserve the commanded body frame and both plants.
 *
 * Scenarios:
 * 1. Positive and negative turns compose the chest split relative to the motionless pelvis and release on the clock.
 * 2. Depth, trunk tilt and backward translation are varied through independent cases at normal and perpendicular headings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the primitive and the independent conditions it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual chest axis, pelvis and planted foot bones so a turn leaking into the legs or a sink moving the plants fails.
 * @evidence contracts/development/testing.md#independent-expectations Rigid transforms specify the requested axis, hip depth and translation separately. The foot target is the standing plant.
 * @evidence contracts/development/testing.md#distinguishing-cases Independent axis moves and the deepest combined move are checked on both contrasting bodies.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario solves the posed geometry on in-memory rigs and gathers every finding before asserting.
 */
export function test_human_motion_compose_trunk_turn(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const body of BODIES) motionComposeTrunk.turnAndSink(body, complaints);
  complaints.assert("A trunk turn and sink preserve the commanded body frame and both plants");
}

/** The shortest and tallest rigs preserve both size extremes. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];
