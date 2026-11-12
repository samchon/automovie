import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Sitting down on a chair looks like it, on the four extreme bodies with
 * each back posture, on a seat at the body's own popliteal height.
 *
 * Bounds and sources:
 * - Seated: on a seat at popliteal height the thighs lie about level and the
 *   shanks stand about upright, the hip and the knee near a right angle
 *   (ANSI/HFES 100-2007, the seated reference posture). Bound: hip and knee
 *   flexion in [70, 110] degrees from `seated` to the end (provisional limits
 *   about the right angle).
 * - Back: sitting upright holds the trunk near vertical; leaning back
 *   reclines it. Bound: upright in [-10, 10] degrees, lean at least 5
 *   degrees behind the upright row (provisional). Slumping tilts the pelvis
 *   back and rounds the spine, which carries the head forward of the
 *   shoulders (Caneiro et al. 2010, Man Ther 15:54); the hip-to-shoulder line
 *   need not tip forward. Bound: the head joint at least 10 mm farther ahead
 *   of the shoulder joints than in the upright row (provisional).
 * - Descent: sitting down inclines the trunk forward to keep the centre of
 *   mass over the feet before the seat takes the weight, by about 30 to 45
 *   degrees (Kralj, Jaeger and Munih 1990, J Biomech 23:1123). Bound: peak
 *   inclination before `seatContact` in [15, 60] degrees (provisional
 *   limits).
 * - Feet: both feet stay on the floor throughout.
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real sit law on real bodies and reads displayed joints and soles; a perched or sunk sit, an upright back that leans, a descent with an upright trunk or a lifted foot fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The seated posture is the standard's, the descent Kralj et al.'s, every limit marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Three backs on four bodies, compared on each, and the default on one.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_sit(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  // The backs are compared on one body, so each is staged on every body; the
  // default joins one body.
  for (const name of motionHumanBody.EXTREMES) {
    const back: Record<string, number> = {};
    const forward: Record<string, number> = {};
    for (const row of [
      ...(name === motionHumanBody.EXTREMES[0] ? ["default"] : []),
      "back=upright",
      "back=lean",
      "back=slump",
    ]) {
      const cell: string = `sit ${row} ${name}`;
      const s: M.IStaged = M.stage("sit", row, name);
      const contact: number = M.event(s, "seatContact")!;
      const seated: number = M.event(s, "seated")!;
      const ts: number[] = M.times(seated, s.film.duration, M.HELD);
      for (const side of ["left", "right"] as const) {
        const hip: number = M.mean(ts, (t) => M.hip(s, t, side));
        const knee: number = M.mean(ts, (t) => M.knee(s, t, side));
        complaints.check(
          `${cell}: seated ${side} hip ${hip.toFixed(1)} and knee ${knee.toFixed(1)} deg, [70, 110] expected (ANSI/HFES 100-2007; provisional)`,
          hip >= 70 && hip <= 110 && knee >= 70 && knee <= 110,
        );
      }
      back[row] = M.mean(ts, (t) => M.trunk(s, t));
      // How far the head's joint stands ahead of the shoulder joints.
      forward[row] = M.mean(ts, (t) => {
        const h = M.joint(s, t, "head");
        const l = M.joint(s, t, "leftUpperArm");
        const r = M.joint(s, t, "rightUpperArm");
        const f = M.forward(s.yaw);
        return (h.x - (l.x + r.x) / 2) * f.x + (h.z - (l.z + r.z) / 2) * f.z;
      });
      let peak: number = -Infinity;
      let lifted: number = 0;
      for (const t of M.times(0, s.film.duration, M.HELD)) {
        if (t <= contact) peak = Math.max(peak, M.trunk(s, t));
        if (!M.bears(s, t, "left") || !M.bears(s, t, "right")) lifted++;
      }
      complaints.check(
        `${cell}: peak trunk inclination ${peak.toFixed(1)} deg before seat contact, [15, 60] expected (Kralj et al. 1990; provisional)`,
        peak >= 15 && peak <= 60,
      );
      complaints.check(
        `${cell}: a foot is off the floor at ${lifted} instants of ${M.HELD} a second`,
        lifted === 0,
      );
    }
    complaints.check(
      `sit ${name}: upright back ${back["back=upright"]!.toFixed(1)} deg, [-10, 10] expected (provisional)`,
      back["back=upright"]! >= -10 && back["back=upright"]! <= 10,
    );
    complaints.check(
      `sit ${name}: lean ${back["back=lean"]!.toFixed(1)} deg, at least 5 behind upright ${back["back=upright"]!.toFixed(1)} expected (provisional)`,
      back["back=lean"]! <= back["back=upright"]! - 5,
    );
    complaints.check(
      `sit ${name}: slumped, the head stands ${(forward["back=slump"]! * 1000).toFixed(0)} mm ahead of the shoulders against ${(forward["back=upright"]! * 1000).toFixed(0)} upright, at least 10 mm more expected (Caneiro et al. 2010; provisional)`,
      forward["back=slump"]! >= forward["back=upright"]! + 0.01,
    );
  }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the sit has the signature of sitting down on a chair");
}
