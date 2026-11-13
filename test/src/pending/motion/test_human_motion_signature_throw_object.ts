import { motionComplaints } from "../../features/internal/motionComplaints";
import { motionHumanBody } from "../../features/internal/motionHumanBody";
import { motionHumanSignature as M } from "../../features/internal/motionHumanSignature";

/**
 * An overarm throw looks like one, on the four extreme bodies throwing to
 * the average man, read at the law's `cocked` and `release`.
 *
 * Bounds and sources (Fleisig, Barrentine, Zheng, Escamilla and Andrews
 * 1999, J Biomech 32:1371, the kinematics of overarm throwing):
 * - Cocking: the throwing elbow is flexed about 90 degrees at maximal
 *   shoulder external rotation. Bound: the throwing elbow flexed in [60,
 *   120] degrees at `cocked` (provisional limits).
 * - Release: the elbow is nearly extended at ball release, about 20 to 25
 *   degrees of flexion. Bound: at most 45 degrees at `release`
 *   (provisional).
 * - Trunk: the trunk is tilted forward at release, about 30 degrees in
 *   pitchers. Bound: inclination at release at least 5 degrees (provisional
 *   lower limit for an untrained throw).
 * - Stride: the stride foot is planted at release.
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real throw to a real catcher and reads displayed joints and soles; a throw without a cocked elbow, a release on a bent arm, a trunk leaning back or both feet off the floor fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The phase shapes are Fleisig et al.'s; every limit is marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The overarm style and both hands on four bodies; the underarm and the toss have other shapes and are not read here.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_throw_object(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES)
    for (const row of ["default", "style=overarm", "hand=left", "hand=right"]) {
      const cell: string = `throwObject ${row} ${name}`;
      const s: M.IStaged = M.stage("throwObject", row, name);
      const cocked: number = M.event(s, "cocked")!;
      const release: number = M.event(s, "release")!;
      const side: "left" | "right" = row === "hand=left" ? "left" : "right";
      const atCock: number = M.elbow(s, cocked, side);
      const atRelease: number = M.elbow(s, release, side);
      complaints.check(
        `${cell}: the throwing elbow is flexed ${atCock.toFixed(1)} deg cocked and ${atRelease.toFixed(1)} at release, [60, 120] then at most 45 expected (Fleisig et al. 1999; provisional)`,
        atCock >= 60 && atCock <= 120 && atRelease <= 45,
      );
      const lean: number = M.trunk(s, release);
      complaints.check(
        `${cell}: trunk inclination ${lean.toFixed(1)} deg at release, at least 5 expected (Fleisig et al. 1999; provisional)`,
        lean >= 5,
      );
      complaints.check(
        `${cell}: a foot is planted at release`,
        M.bears(s, release, "left") || M.bears(s, release, "right"),
      );
    }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the throw has the signature of an overarm throw");
}
