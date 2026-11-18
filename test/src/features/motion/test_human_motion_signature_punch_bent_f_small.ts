import { motionComplaints } from "../internal/motionComplaints";
import { motionPunchSignature } from "../internal/motionPunchSignature";

/**
 * A hook and an uppercut on the small woman both keep a bent elbow at
 * impact (60 to 120 degrees within the 0.1-degree read-back resolution).
 * Both retain the delivery and guard bounds of the straight punch.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed joint centres of both performers against the signature in `motionPunchSignature`.
 * @evidence contracts/development/testing.md#independent-expectations Reads the technique's elbow angle and the literature's band of near-impact fist speeds (Kimm and Thiel 2015). The delivery, range and inclination limits are provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Hook and uppercut travel in different planes and select different default hands.
 * @evidence contracts/development/testing.md#execution-ownership A focused in-memory film per distinct branch.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the branch and the properties it distinguishes.
 */
export function test_human_motion_signature_punch_bent_f_small(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionPunchSignature(complaints, "f-small", motionPunchSignature.BENT);
  complaints.assert("the punch has the signature of a boxer's punch");
}
