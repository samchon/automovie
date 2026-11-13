import type { IAutoMovieVector3 } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A punch looks like a boxer's punch, on the four extreme bodies against the
 * average man's face from the striking captures' range, read between the
 * law's `launch` and `impact`.
 *
 * Bounds and sources:
 * - Arm at impact: a straight punch reaches the target with the elbow
 *   almost extended; a hook and an uppercut land with the elbow bent near a
 *   right angle (the defining technique of each, as boxing biomechanics
 *   describes it). Bound: a straight punch's elbow flexion at impact at most
 *   30 degrees; a hook's and an uppercut's in [60, 120] (provisional).
 * - Fist speed: straight punches reach about 8 to 12 m/s at the fist (Kimm
 *   and Thiel 2015, Procedia Eng 112:502). Bound: the punching hand's peak
 *   speed between launch and impact in [5, 15] m/s (provisional limits
 *   around the reported range).
 * - Delivery: a punch's movement time from launch to impact is a few tenths
 *   of a second. Bound: in [0.15, 0.6] s (provisional).
 * - Contact: a punch thrown to hit reaches the face. Bound: with `accuracy`
 *   hit, the punching hand's joint within one hand length of the partner's
 *   face region at impact.
 * - Contact only at the contact event: with `accuracy` hit, until a tenth
 *   of a second before impact the punching hand stays farther than a hand
 *   length from the face.
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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real punch against a real partner and reads displayed joints of both; a straight punch on a bent arm, a hook on a straight one, a slow or instant fist, a hit that misses or a trunk leaning back fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The arm shapes are each technique's definition; the speed is cited; the other limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Three techniques, both hands and the hit row on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a film of fitted poses is costly; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_punch(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const partner = motionHumanBody("m-average");
  for (const name of motionHumanBody.EXTREMES)
    for (const row of [
      "default",
      "technique=straight",
      "technique=hook",
      "technique=uppercut",
      "hand=lead",
      "hand=rear",
      "accuracy=hit",
    ]) {
      const cell: string = `punch ${row} ${name}`;
      const s: M.IStaged = M.stage("punch", row, name);
      const launch: number = M.event(s, "launch")!;
      const impact: number = M.event(s, "impact")!;
      // The punching hand travels farther from launch to impact.
      const travel = (side: "left" | "right"): number => {
        const a: IAutoMovieVector3 = M.joint(s, launch, `${side}Hand`);
        const b: IAutoMovieVector3 = M.joint(s, impact, `${side}Hand`);
        return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      };
      const side: "left" | "right" =
        travel("left") > travel("right") ? "left" : "right";
      const elbow: number = M.elbow(s, impact, side);
      const bent: boolean =
        row === "technique=hook" || row === "technique=uppercut";
      complaints.check(
        `${cell}: elbow flexion ${elbow.toFixed(1)} deg at impact (${side}), ${bent ? "[60, 120]" : "at most 30"} expected (provisional)`,
        bent ? elbow >= 60 && elbow <= 120 : elbow <= 30,
      );
      const peak: number = M.speed(s, `${side}Hand`, launch, impact);
      complaints.check(
        `${cell}: peak fist speed ${peak.toFixed(2)} m/s, [5, 15] expected (Kimm and Thiel 2015; provisional)`,
        peak >= 5 && peak <= 15,
      );
      complaints.check(
        `${cell}: launch to impact ${(impact - launch).toFixed(3)} s, [0.15, 0.6] expected (provisional)`,
        impact - launch >= 0.15 && impact - launch <= 0.6,
      );
      if (row === "accuracy=hit") {
        const face: IAutoMovieVector3 = M.region(
          s,
          "b",
          partner,
          "face",
          impact,
        );
        const hand: IAutoMovieVector3 = M.joint(s, impact, `${side}Hand`);
        const gap: number = Math.hypot(
          face.x - hand.x,
          face.y - hand.y,
          face.z - hand.z,
        );
        complaints.check(
          `${cell}: the hand is ${(gap * 1000).toFixed(0)} mm from the partner's face at impact, within a hand length (${(s.body.measure.hand * 1000).toFixed(0)} mm) expected`,
          gap <= s.body.measure.hand,
        );
        // Contact only at the contact event: before it the fist is clear.
        let early: number = Infinity;
        let when: number = launch;
        for (const t of M.times(launch, impact - 0.1, 60)) {
          const f = M.region(s, "b", partner, "face", t);
          const h = M.joint(s, t, `${side}Hand`);
          const d: number = Math.hypot(f.x - h.x, f.y - h.y, f.z - h.z);
          if (d < early) {
            early = d;
            when = t;
          }
        }
        complaints.check(
          `${cell}: the hand comes within ${(early * 1000).toFixed(0)} mm of the face at ${when.toFixed(2)} s, a tenth of a second or more before impact; farther than ${(s.body.measure.hand * 1000).toFixed(0)} mm (a hand length) expected`,
          early > s.body.measure.hand,
        );
      }
      const set: number = M.event(s, "set") ?? launch;
      const clear: number = M.apart(s, set, partner);
      complaints.check(
        `${cell}: in the guard (${set.toFixed(2)} s) the two fighters stand ${(clear * 1000).toFixed(0)} mm apart (least joint-to-body distance), not inside each other expected`,
        clear >= 0,
      );
      const lean: number = M.trunk(s, impact);
      complaints.check(
        `${cell}: trunk inclination ${lean.toFixed(1)} deg at impact, at least -2 expected (provisional)`,
        lean >= -2,
      );
    }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the punch has the signature of a boxer's punch");
}
