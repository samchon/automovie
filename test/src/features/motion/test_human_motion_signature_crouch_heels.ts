import { motionComplaints } from "../internal/motionComplaints";
import { motionCrouchSignature } from "../internal/motionCrouchSignature";

/**
 * A crouch looks like a human squat held in place: the heel postures, flat
 * and raised, each on the extreme body the covering of all the crouch's rows
 * gives it, read over the held span from the law's `lowest` to its
 * `ascend`.
 *
 * Bounds and sources:
 * - Depth: a full (deep) squat folds the knees to about 150 degrees
 *   (Hemmerich, Brown, Smith, Marthandam and Wyss 2006, J Orthop Res
 *   24:770); a partial squat stops near a right angle or above (Escamilla
 *   2001, Med Sci Sports Exerc 33:127). Bound: full at least 120, partial in
 *   [40, 110] degrees (provisional limits).
 * - Heels: flat heels bear on the floor; raised heels stand off it. Bound:
 *   the heel sockets within 20 mm of the floor when flat, at least 30 mm
 *   above it when raised (provisional).
 * - Balance: a squat held still keeps the centre of mass over the feet,
 *   inside the base of support, or the body would topple (static
 *   equilibrium). Bound: the centre's margin inside the hull of both feet's
 *   soles is not negative at any held instant.
 * - Trunk: a squat inclines the trunk forward to bring the centre of mass
 *   over the feet as the hips go back, more the deeper it is (Hemmerich et
 *   al. 2006). Bound: mean inclination while held, measured from the body's
 *   own quiet stance, at least 0 degrees, and at least 5 for a full squat
 *   (provisional).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it on every
 * body read (Kendall et al. 2005, ideal alignment;
 * `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real crouch on real bodies and reads displayed joints, soles and the centre of mass; a shallow full squat, a deep partial one, a heel that floats or sinks, a body balanced outside its feet or a trunk tipped back fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a cited squat value, the static equilibrium, or marked provisional with its reason.
 * @evidence contracts/development/testing.md#distinguishing-cases Both heel postures (`motionCrouchSignature.HEELS`); the depths are `test_human_motion_signature_crouch_depth`'s and `test_human_motion_signature_crouch_full`'s, split so each runs well under a minute alone.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a film of fitted poses is costly, so the reading is split by rows (`motionCrouchSignature`); the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, the rows and the split.
 */
export function test_human_motion_signature_crouch_heels(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  motionCrouchSignature(complaints, motionCrouchSignature.HEELS);
  complaints.assert("the crouch has the signature of a held squat");
}
