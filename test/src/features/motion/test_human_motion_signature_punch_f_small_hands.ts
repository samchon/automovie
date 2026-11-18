import { motionComplaints } from "../internal/motionComplaints";
import { motionPunchSignature } from "../internal/motionPunchSignature";

/**
 * Both straight punches on the small woman meet the same signature bounds.
 * The reach branch must extend the acting elbow, deliver within 0.15 to
 * 0.6 seconds, and reach 5 to 15 m/s. The rear arm's elbow stays continuous
 * at impact and its acromion speed contributes to the fist speed
 * (Cheraghi et al. 2014, Table 1).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed joint centres of both performers against the signature in `motionPunchSignature`.
 * @evidence contracts/development/testing.md#independent-expectations Reads the technique's elbow angle and the literature's band of near-impact fist speeds (Kimm and Thiel 2015). The delivery, range and inclination limits are provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Lead and rear on the original small body, where rear extension and speed previously failed.
 * @evidence contracts/development/testing.md#execution-ownership A focused in-memory film per distinct branch.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the branch and the properties it distinguishes.
 */
export function test_human_motion_signature_punch_f_small_hands(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionPunchSignature(complaints, "f-small", motionPunchSignature.HANDS, true);
  complaints.assert("the punch has the signature of a boxer's punch");
}
