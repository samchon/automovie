import { motionComplaints } from "../../features/internal/motionComplaints";
import { motionHumanBody } from "../../features/internal/motionHumanBody";
import { motionHumanSignature as M } from "../../features/internal/motionHumanSignature";

/**
 * Climbing stairs looks like human stair walking, on the four extreme bodies
 * up and down four stairs, step over step and step by step, leading with
 * either foot.
 *
 * Bounds and sources (McFadyen and Winter 1988, J Biomech 21:733, the
 * reference kinematics of stair ascent and descent):
 * - Ascent trunk: the trunk inclines forward on the way up, more than on
 *   level ground. Bound: mean inclination from the first toe-off to the
 *   arrival in [2, 20] degrees (provisional limits; McFadyen and Winter and
 *   later studies report a few degrees to about ten).
 * - Ascent swing: the swinging knee folds to about 90 to 100 degrees to lift
 *   the foot over the nosing. Bound: peak knee flexion of the leg that swings
 *   to each tread at least 80 degrees (provisional lower limit).
 * - Ascent contact: the leading knee lands on the tread flexed about 60
 *   degrees. Bound: the knee of the landing foot at each tread contact in
 *   [45, 80] degrees (provisional limits around the reported value).
 * - The step values apply to a foot that lands on another tread than the
 *   other foot; a foot brought level with the other (each second step of
 *   step-by-step, the closing step onto a landing) is a step-to and is not
 *   read.
 * - Descent: the supporting knee flexes to about 90 degrees as the body is
 *   lowered to the next tread. Bound: peak knee flexion over each step at
 *   least 70 degrees (provisional lower limit).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real stair law on real bodies and reads displayed joints at its own tread contacts; a trunk tipped back on the way up, a stiff swing or a landing on a straight knee fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is from McFadyen and Winter's stair kinematics or marked provisional with its reason.
 * @evidence contracts/development/testing.md#distinguishing-cases Both directions, both patterns and both lead feet on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_climb_stairs(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES)
    for (const row of [
      "default",
      "direction=up",
      "direction=down",
      "pattern=stepOverStep",
      "pattern=stepByStep",
      "lead=left",
      "lead=right",
    ]) {
      const cell: string = `climbStairs ${row} ${name}`;
      const up: boolean = row !== "direction=down";
      const s: M.IStaged = M.stage("climbStairs", row, name);
      const offs: number[] = [];
      const ons: number[] = [];
      for (let i: number = 1; ; i++) {
        const off: number | undefined = M.event(s, `toeOff${i}`);
        const on: number | undefined = M.event(s, `treadContact${i}`);
        if (off === undefined || on === undefined) break;
        offs.push(off);
        ons.push(on);
      }
      if (offs.length === 0) {
        complaints.check(
          `${cell}: the law names its toe-offs and tread contacts`,
          false,
        );
        continue;
      }
      const end: number = M.event(s, "arrived") ?? s.film.duration;
      if (up) {
        const lean: number = M.mean(M.times(offs[0]!, end, 30), (t) =>
          M.trunk(s, t),
        );
        complaints.check(
          `${cell}: mean trunk inclination ${lean.toFixed(2)} deg on the way up outside [2, 20] (McFadyen and Winter 1988; provisional)`,
          lean >= 2 && lean <= 20,
        );
      }
      offs.forEach((off: number, i: number): void => {
        const on: number = ons[i]!;
        const mid: number = (off + on) / 2;
        const swing: "left" | "right" =
          M.sole(s, mid, "left").y - M.sole(s, off, "left").y >
          M.sole(s, mid, "right").y - M.sole(s, off, "right").y
            ? "left"
            : "right";
        const stance: "left" | "right" = swing === "left" ? "right" : "left";
        // Only a step to another tread is a stair step: a foot brought
        // level with the other on the same tread (step by step, or the
        // closing step onto a landing) is a step-to, which these values do
        // not describe.
        const rise: number = M.sole(s, on, swing).y - M.sole(s, on, stance).y;
        if (Math.abs(rise) < 0.05) return;
        let peak: number = 0;
        for (const t of M.times(off, on, 60))
          peak = Math.max(peak, M.knee(s, t, up ? swing : stance));
        if (up) {
          complaints.check(
            `${cell} step ${i + 1}: peak swing knee flexion (${swing}) ${peak.toFixed(1)} deg below 80 (McFadyen and Winter 1988; provisional)`,
            peak >= 80,
          );
          const landing: number = M.knee(s, on, swing);
          complaints.check(
            `${cell} step ${i + 1}: the landing knee (${swing}) is flexed ${landing.toFixed(1)} deg at tread contact, outside [45, 80] (McFadyen and Winter 1988; provisional)`,
            landing >= 45 && landing <= 80,
          );
        } else
          complaints.check(
            `${cell} step ${i + 1}: peak supporting knee flexion (${stance}) ${peak.toFixed(1)} deg below 70 (McFadyen and Winter 1988; provisional)`,
            peak >= 70,
          );
      });
    }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the stairs have the signature of stair walking");
}
