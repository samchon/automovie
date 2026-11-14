import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A kneel looks like human kneeling, on the four extreme bodies on one knee,
 * on both, and sitting back on the heels, read over the settled span from the
 * law's `settled` to its `kneeOff`.
 *
 * The postures are the three standard kneeling postures, the half-kneel, the
 * upright kneel and the seiza; no measured joint angles of them are cited
 * here, so every numeric bound is provisional, set about the posture's
 * defining geometry:
 * - On one knee (half-kneel): the kneeling knee rests on the floor, its
 *   thigh near vertical; the other foot is flat ahead with its shin near
 *   vertical and its thigh near horizontal. Bound: the kneeling knee joint
 *   within 0.08 m of the floor (a patella's thickness and the skin,
 *   provisional), its hip flexion at most 30 degrees, the front knee's
 *   flexion in [70, 110] and its foot bearing (provisional limits about the
 *   right angle).
 * - On both knees (upright kneel): both knees on the floor, both thighs near
 *   vertical, both knees near a right angle. Bound: both knee joints within
 *   0.08 m of the floor, hip flexion at most 30 and knee flexion in [70, 110]
 *   degrees (provisional).
 * - Sitting back (seiza): both knees on the floor and fully folded under the
 *   body, the knee flexion near 150 degrees. Bound: both knees within 0.08 m
 *   of the floor and folded at least 130 degrees (provisional).
 * - Trunk: kneeling holds the trunk upright. Bound: mean inclination in
 *   [-10, 15] degrees (provisional).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real kneel on real bodies and reads displayed joints and soles; a knee hovering above the floor, a thigh tipped forward, a front shin slanted or a heel sit not folded fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The postures are the standard kneeling postures; every numeric bound is marked provisional with its reason.
 * @evidence contracts/development/testing.md#distinguishing-cases Three kinds and both kneeling knees, each row on one body and every body in some row (`motionHumanSignature.cells`).
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a film of fitted poses is costly; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every posture and bound with its status.
 */
export function test_human_motion_signature_kneel(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const { row, name } of M.cells([
    "default",
    "kind=one",
    "kind=both",
    "kind=sitBack",
    "knee=left",
    "knee=right",
  ])) {
    const cell: string = `kneel ${row} ${name}`;
    const kind: string = row.startsWith("kind=") ? row.slice(5) : "one";
    const s: M.IStaged = M.stage("kneel", row, name);
    const t: number =
      ((M.event(s, "settled") ?? 0) +
        (M.event(s, "kneeOff") ?? s.film.duration)) /
      2;
    const height = (side: "left" | "right"): number =>
      M.joint(s, t, `${side}LowerLeg`).y;
    const down: "left" | "right" =
      height("left") < height("right") ? "left" : "right";
    const up: "left" | "right" = down === "left" ? "right" : "left";
    const kneeling: ("left" | "right")[] = kind === "one" ? [down] : [down, up];
    for (const side of kneeling) {
      complaints.check(
        `${cell}: the ${side} knee joint stands ${(height(side) * 1000).toFixed(0)} mm off the floor, within 80 expected (provisional)`,
        height(side) <= 0.08,
      );
      if (kind === "sitBack")
        complaints.check(
          `${cell}: the ${side} knee is folded ${M.knee(s, t, side).toFixed(1)} deg sitting back, at least 130 expected (provisional)`,
          M.knee(s, t, side) >= 130,
        );
      else {
        complaints.check(
          `${cell}: the kneeling ${side} hip is flexed ${M.hip(s, t, side).toFixed(1)} deg, at most 30 expected (provisional)`,
          M.hip(s, t, side) <= 30,
        );
        if (kind === "both")
          complaints.check(
            `${cell}: the ${side} knee is flexed ${M.knee(s, t, side).toFixed(1)} deg, [70, 110] expected (provisional)`,
            M.knee(s, t, side) >= 70 && M.knee(s, t, side) <= 110,
          );
      }
    }
    if (kind === "one")
      complaints.check(
        `${cell}: the front (${up}) knee is flexed ${M.knee(s, t, up).toFixed(1)} deg with its foot ${M.bears(s, t, up) ? "down" : "up"}, [70, 110] and down expected (provisional)`,
        M.knee(s, t, up) >= 70 && M.knee(s, t, up) <= 110 && M.bears(s, t, up),
      );
    const lean: number = M.trunk(s, t);
    complaints.check(
      `${cell}: trunk inclination ${lean.toFixed(1)} deg while kneeling, [-10, 15] expected (provisional)`,
      lean >= -10 && lean <= 15,
    );
  }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the kneel has the signature of human kneeling");
}
