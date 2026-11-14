import { motionComplaints } from "../internal/motionComplaints";
import { motionKickSignature } from "../internal/motionKickSignature";

/**
 * A kick looks like a martial-arts kick: the round kick, as the row leaves it and as the technique names it on the small woman, against
 * the average man's ribs from the striking captures' range, read between the
 * law's `launch`, `chamber` and `impact`.
 *
 * Bounds and sources:
 * - Chamber and snap: a roundhouse kick folds the knee in the chamber and
 *   extends it into the target, the foot reaching its peak speed near
 *   impact (Kim, Kwon, Yenuga and Kwon 2010, Sports Biomech 9:98, the
 *   taekwondo roundhouse kick). Bound: the kicking knee folded at least 60
 *   degrees at `chamber` and at most 45 at `impact` (provisional limits).
 * - Foot speed: roundhouse kicks reach about 10 to 16 m/s at the foot (Kim
 *   et al. 2010). Bound: the kicking foot's peak speed from launch to impact
 *   in [6, 20] m/s (provisional limits around the reported range).
 * - Hip and timing: the kicking hip flexes well past 50 degrees at impact
 *   and the kick takes some tenths of a second (Kim et al. 2010). Bound: hip
 *   flexion at least 50 degrees and launch to impact in [0.2, 1.0] s
 *   (provisional).
 * - Target: a kick lands on the ribs it is aimed at. Bound: the kicking
 *   ankle within a foot length of the partner's ribs region at impact.
 * - Range: at `set` no joint centre of either fighter lies inside the
 *   other's colliders.
 * - Support: the support foot stays on the floor from chamber to impact.
 * - Height: a kick at the ribs lands at the ribs. Bound: the kicking foot's
 *   joint at impact at least half the kicker's hip height above the floor
 *   (provisional, the ribs stand above the hips).
 *
 * Scenarios, on the small woman (`f-small`):
 * 1. Each staged row plans and every bound above holds at its `launch`,
 *    `chamber`, `set` and `impact`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real kick against a real partner and reads displayed joints and soles; a kick without a chamber, one that lands on a bent knee, a slow foot, a hopping support foot or a low foot fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The chamber and snap and the speed are cited; the other limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The round kick, as the row leaves it and as the technique names it (`motionKickSignature.ROUND`) on the small woman; the other rows and bodies are their own specs, split so each runs under a minute alone.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a film of fitted poses is costly, so the reading is split by body and rows (`motionKickSignature`); the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, the split and the scenario.
 */
export function test_human_motion_signature_kick_f_small(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionKickSignature(complaints, "f-small", motionKickSignature.ROUND);
  complaints.assert("the kick has the signature of a martial-arts kick");
}
