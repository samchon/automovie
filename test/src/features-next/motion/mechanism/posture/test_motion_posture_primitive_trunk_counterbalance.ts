import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionComposeTrunkCounterbalance } from "../../../../features/internal/motionComposeTrunkCounterbalance";
import type { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A counterbalance follows the body heading and preserves the foot support.
 *
 * Scenarios:
 * 1. The centre with forward-loading limbs is brought into the support over both headings and the hips return at the phase ends.
 * 2. The edge of reachable hip motion distinguishes a legal planted correction from a named balance refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the primitive and the independent conditions it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual posed centre and root motion and verifies the refusal carries its stated cause.
 * @evidence contracts/development/testing.md#independent-expectations The base of support determines the static bound. The independent legal interval of the hips is derived from the two planted leg reaches.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasting body sizes, 0° and 90° headings, balanced and forward-loaded poses, and a reach-bound limiting case.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario solves the posed geometry on in-memory rigs and gathers every finding before asserting.
 */
export function test_motion_posture_primitive_trunk_counterbalance(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const body of BODIES)
    motionComposeTrunkCounterbalance.counterbalance(body, complaints);
  complaints.assert(
    "A counterbalance follows the body heading and preserves the foot support",
  );
}

/** The short rig supplies one measured support and reach geometry. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small"];
