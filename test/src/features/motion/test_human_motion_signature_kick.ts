import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanFoot } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A kick looks like a martial-arts kick, on the four extreme bodies against
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
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real kick against a real partner and reads displayed joints and soles; a kick without a chamber, one that lands on a bent knee, a slow foot, a hopping support foot or a low foot fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The chamber and snap and the speed are cited; the other limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Both techniques and both legs on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_kick(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const partner = motionHumanBody("m-average");
  for (const name of motionHumanBody.EXTREMES)
    for (const row of [
      "default",
      "technique=round",
      "technique=push",
      "leg=lead",
      "leg=rear",
    ]) {
      const cell: string = `kick ${row} ${name}`;
      const s: M.IStaged = M.stage("kick", row, name);
      const launch: number = M.event(s, "launch")!;
      const chamber: number = M.event(s, "chamber")!;
      const impact: number = M.event(s, "impact")!;
      const height = (side: "left" | "right"): number =>
        M.joint(s, impact, `${side}Foot`).y;
      const side: "left" | "right" =
        height("left") > height("right") ? "left" : "right";
      const support: "left" | "right" = side === "left" ? "right" : "left";
      const folded: number = M.knee(s, chamber, side);
      const snapped: number = M.knee(s, impact, side);
      complaints.check(
        `${cell}: the kicking knee (${side}) is folded ${folded.toFixed(1)} deg at chamber and ${snapped.toFixed(1)} at impact, at least 60 then at most 45 expected (Kim et al. 2010; provisional)`,
        folded >= 60 && snapped <= 45,
      );
      const peak: number = M.speed(s, `${side}Foot`, launch, impact);
      complaints.check(
        `${cell}: peak foot speed ${peak.toFixed(2)} m/s, [6, 20] expected (Kim et al. 2010; provisional)`,
        peak >= 6 && peak <= 20,
      );
      let hopped: number = 0;
      for (const t of M.times(chamber, impact, 120))
        if (!M.bears(s, t, support)) hopped++;
      complaints.check(
        `${cell}: the support foot (${support}) is off the floor at ${hopped} instants of 120 a second from chamber to impact`,
        hopped === 0,
      );
      const hip: number = M.hip(s, impact, side);
      complaints.check(
        `${cell}: the kicking hip (${side}) is flexed ${hip.toFixed(1)} deg at impact, at least 50 expected (Kim et al. 2010; provisional)`,
        hip >= 50,
      );
      complaints.check(
        `${cell}: launch to impact ${(impact - launch).toFixed(3)} s, [0.2, 1.0] expected (Kim et al. 2010; provisional)`,
        impact - launch >= 0.2 && impact - launch <= 1.0,
      );
      const ribs: IAutoMovieVector3 = M.region(
        s,
        "b",
        partner,
        "ribsLeft",
        impact,
      );
      const ankle: IAutoMovieVector3 = M.joint(s, impact, `${side}Foot`);
      const reach: number = Math.hypot(
        ribs.x - ankle.x,
        ribs.y - ankle.y,
        ribs.z - ankle.z,
      );
      const heel: IAutoMovieVector3 = HumanFoot.offset(s.body, side, "heel");
      const toe: IAutoMovieVector3 = HumanFoot.offset(s.body, side, "toe");
      const footLength: number = Math.hypot(
        toe.x - heel.x,
        toe.y - heel.y,
        toe.z - heel.z,
      );
      complaints.check(
        `${cell}: the kicking ankle is ${(reach * 1000).toFixed(0)} mm from the partner's ribs at impact, within a foot length (${(footLength * 1000).toFixed(0)} mm) expected`,
        reach <= footLength,
      );
      const set: number = M.event(s, "set") ?? launch;
      const clear: number = M.apart(s, set, partner);
      complaints.check(
        `${cell}: in the guard (${set.toFixed(2)} s) the two fighters stand ${(clear * 1000).toFixed(0)} mm apart (least joint-to-body distance), not inside each other expected`,
        clear >= 0,
      );
      const foot: IAutoMovieVector3 = M.joint(s, impact, `${side}Foot`);
      complaints.check(
        `${cell}: the kicking foot is ${(foot.y * 1000).toFixed(0)} mm high at impact, at least half the hip height (${((s.body.measure.hipHeight / 2) * 1000).toFixed(0)} mm) expected (provisional)`,
        foot.y >= s.body.measure.hipHeight / 2,
      );
    }
  complaints.assert("the kick has the signature of a martial-arts kick");
}
