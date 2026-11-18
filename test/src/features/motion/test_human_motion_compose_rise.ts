import { motionComplaints } from "../internal/motionComplaints";
import { motionComposeRise } from "../internal/motionComposeRise";
import type { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Rising onto the toes is a rigid turn about the loaded contact.
 *
 * Scenarios:
 * 1. At 0°, 10°, 20° and 35° the ankle height follows the rotated sole lever at both tested headings and the contact point stays fixed.
 * 2. The root lifts by the mean ankle motion. Each leg primitive independently preserves the settled toe placement and flat toe orientation.
 * 3. The average body's 35° raise remains inside the original anatomical height interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the closed-form constraint and the positive, boundary and out-of-range cases the helper reads.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual foot placement, root shift and displayed limb through the body's own forward kinematics. An ankle-centred turn, stretched foot or tilted toe fails.
 * @evidence contracts/development/testing.md#independent-expectations Rigid rotation predicts the ankle's vertical component as the sum of the old vertical and forward components weighted by cosine and sine. Fixed toe contacts and the two ankle displacements determine the required body rise.
 * @evidence contracts/development/testing.md#distinguishing-cases A small foot, large foot, short-legged reach and average foot's physiological interval exercise distinct geometry.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test runs these geometric checks on in-memory bodies, collecting all findings before its sole assertion.
 */
export function test_human_motion_compose_rise(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of BODIES) motionComposeRise(name, complaints);
  complaints.assert("Rising onto the toes is a rigid turn about the loaded contact");
}

/** Contrasting fixtures selected by the geometry this primitive uses. */
const BODIES: readonly motionHumanBody.Name[] = [
  "f-small",
  "m-large",
  "m-short-legged",
  "m-average",
];
