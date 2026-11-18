import { motionComplaints } from "../internal/motionComplaints";
import { motionComposeGaze } from "../internal/motionComposeGaze";
import type { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The gaze reaches a point through the smallest recruited head-and-eye chain.
 *
 * Scenarios:
 * 1. The displayed eye axes meet the target inside the recruited range. Near targets leave the head still; the eyes-only mode does not move the head for far ones.
 * 2. Opposite yaw and pitch, out-of-range targets and weights at and outside both ends distinguish the branches of the angular solve.
 * 3. Look and glance read at their authored times without writing the carrier's limbs or trunk.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the closed-form constraint and the positive, boundary and out-of-range cases the helper reads.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual eye, neck, head and chest frames. A point missed in an attainable range or a part moved outside its selected branch fails with the body and target.
 * @evidence contracts/development/testing.md#independent-expectations An angular miss is the geometric angle between the displayed eye axis and the independent line to the target. Freedman's recruitment model supplies the eye-first split.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests angular branches on the shortest and largest fixtures, with each fixture's own eye offsets.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test runs these geometric checks on in-memory bodies, collecting all findings before its sole assertion.
 */
export function test_human_motion_compose_gaze(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of BODIES) motionComposeGaze(name, complaints);
  complaints.assert("The gaze reaches a point through the smallest recruited head-and-eye chain");
}

/** Contrasting fixtures selected by the geometry this primitive uses. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];
