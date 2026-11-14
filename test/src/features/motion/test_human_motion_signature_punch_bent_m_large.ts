import { motionComplaints } from "../internal/motionComplaints";
import { motionPunchSignature } from "../internal/motionPunchSignature";

/**
 * A punch looks like a boxer's punch: the hook and the uppercut on the large man, against the
 * average man's face from the striking captures' range, read between the
 * law's `launch` and `impact`.
 *
 * Bounds and sources:
 * - Arm at impact: a straight punch reaches the target with the elbow
 *   almost extended; a hook and an uppercut land with the elbow bent near a
 *   right angle (the defining technique of each, as boxing biomechanics
 *   describes it). Bound: a straight punch's elbow flexion at impact at most
 *   30 degrees; a hook's and an uppercut's in [60, 120] (provisional); each
 *   end compared within 0.1 degree, the read-back resolution of an angle at
 *   a band's edge (`motionPunchSignature.TOLERANCE`, its basis stated there).
 * - Fist speed: straight punches reach about 8 to 12 m/s at the fist (Kimm
 *   and Thiel 2015, Procedia Eng 112:502). Bound: the punching hand's peak
 *   speed between launch and impact in [5, 15] m/s (provisional limits
 *   around the reported range).
 * - Delivery: a punch's movement time from launch to impact is a few tenths
 *   of a second. Bound: in [0.15, 0.6] s (provisional).
 * - Contact: a punch thrown to hit reaches the face. Bound: with `accuracy`
 *   hit, the punching hand's joint within one hand length of the partner's
 *   face region at impact, and until a tenth of a second before impact
 *   farther than a hand length from it.
 * - Range: fighters in their guards stand apart. Bound: at `set` no joint
 *   centre of either lies inside the other's colliders.
 * - Trunk: a boxer leans into a punch, never back from it. Bound:
 *   inclination at impact at least -2 degrees (provisional: the shoulders
 *   no more than a little behind the hips).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 * The reading is shared by the punch signature specs, split by body and by
 * technique so each runs under a minute alone (`motionPunchSignature`).
 *
 * Scenarios, on the large man (`m-large`):
 * 1. Each staged row plans and every bound above holds at its `launch`,
 *    `set` and `impact`.
 * 2. The body's quiet stance reads its trunk within 3 degrees of vertical.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real punch against a real partner and reads displayed joints of both; a straight punch on a bent arm, a hook on a straight one, a slow or instant fist, a hit that misses or a trunk leaning back fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The arm shapes are each technique's definition; the speed is cited; the other limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The hook and the uppercut (`motionPunchSignature.BENT`) on the large man; the other rows and bodies are their own specs, split so each runs under a minute alone.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a film of fitted poses is costly, so the reading is split to keep each spec under a minute; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, the split and the 2 scenarios.
 */
export function test_human_motion_signature_punch_bent_m_large(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionPunchSignature(complaints, "m-large", motionPunchSignature.BENT);
  complaints.assert("the punch has the signature of a boxer's punch");
}
