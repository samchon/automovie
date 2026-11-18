import { motionComplaints } from "../internal/motionComplaints";
import { motionPunchSignature } from "../internal/motionPunchSignature";

/**
 * The large man's straight hit reaches the partner's face within one hand
 * length at impact. Through the approach that ends a tenth of a second
 * before impact, the fist stays outside that distance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed joint centres of both performers against the signature in `motionPunchSignature`.
 * @evidence contracts/development/testing.md#independent-expectations Reads the technique's elbow angle and the literature's band of near-impact fist speeds (Kimm and Thiel 2015). The delivery, range and inclination limits are provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Explicit hit accuracy runs the face-contact branch on the largest rig.
 * @evidence contracts/development/testing.md#execution-ownership A focused in-memory film per distinct branch.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the branch and the properties it distinguishes.
 */
export function test_human_motion_signature_punch_m_large_hit(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionPunchSignature(complaints, "m-large", motionPunchSignature.HIT);
  complaints.assert("the punch has the signature of a boxer's punch");
}
