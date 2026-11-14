import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanStairSignature } from "../internal/motionHumanStairSignature";

/**
 * Climbing stairs looks like human stair walking on the small woman, up and down four
 * stairs, step over step and step by step, leading with either foot, read
 * against McFadyen and Winter's stair kinematics (1988, J Biomech 21:733)
 * with the bounds `motionHumanStairSignature` states: the ascent's trunk
 * inclination in [2, 20] degrees, the swinging knee's peak at least 80, the
 * landing knee at tread contact in [45, 80] and the descent's supporting
 * knee's peak at least 70 (all provisional around the reported values), on
 * a quiet stance read within 3 degrees of vertical.
 *
 * Scenarios, for each of the seven rows (`motionHumanStairSignature.ROWS`):
 * 1. Going up, the trunk inclines within its band.
 * 2. Each step up to another tread swings its knee past 80 degrees and lands
 *    it flexed within [45, 80].
 * 3. Each step down flexes the supporting knee past 70 degrees.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real stair law on a real body and reads displayed joints at its own tread contacts; a trunk tipped back on the way up, a stiff swing or a landing on a straight or a deep knee fails with its row, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is from McFadyen and Winter's stair kinematics or marked provisional with its reason.
 * @evidence contracts/development/testing.md#distinguishing-cases Both directions, both patterns and both lead feet; the other bodies of the extremes are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs seven films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status and the 3 scenarios.
 */
export function test_human_motion_signature_climb_stairs_f_small(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionHumanStairSignature.read("f-small", complaints);
  complaints.assert("the stairs have the signature of stair walking");
}
