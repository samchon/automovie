import type { AutoMovieHumanSide } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";
import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A settled kneel has the geometry of one knee, both knees or the seated
 * posture on the heels, read between `settled` and `kneeOff`.
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
 * @evidence contracts/development/testing.md#distinguishing-cases Distinct one-knee sides include the omitted default. The upright two-knee and folded seiza cases vary knee depth at the two stature extremes.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a film of fitted poses is costly; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every posture and bound with its status.
 */
export function test_human_motion_signature_kneel(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const { row, name } of CELLS) {
    const cell: string = `kneel ${row} ${name}`;
    const kind: string = row.startsWith("kind=") ? row.slice(5) : "one";
    let s: M.IStaged;
    try {
      s = M.stage("kneel", row, name);
    } catch (error) {
      complaints.check(
        `${cell}: refused, ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
      continue;
    }
    const t: number =
      ((M.event(s, "settled") ?? 0) +
        (M.event(s, "kneeOff") ?? s.film.duration)) /
      2;
    const height: (side: AutoMovieHumanSide) => number = (side: AutoMovieHumanSide): number =>
      M.joint(s, t, `${side}LowerLeg`).y;
    const down: AutoMovieHumanSide = row === "knee=left" ? "left" : "right";
    const up: AutoMovieHumanSide = down === "left" ? "right" : "left";
    const kneeling: AutoMovieHumanSide[] = kind === "one" ? [down] : [down, up];
    if (kind === "one")
      complaints.check(
        `${cell}: the declared ${down} knee bears below the ${up} knee`,
        height(down) < height(up),
      );
    for (const side of kneeling) {
      const knee: number = M.knee(s, t, side);
      complaints.check(
        `${cell}: the ${side} knee joint stands ${(height(side) * 1000).toFixed(0)} mm off the floor, within 80 expected (provisional)`,
        height(side) <= 0.08,
      );
      if (kind === "sitBack")
        complaints.check(
          `${cell}: the ${side} knee is folded ${knee.toFixed(1)} deg sitting back, at least 130 expected (provisional)`,
          knee >= 130,
        );
      else {
        const hip: number = M.hip(s, t, side);
        complaints.check(
          `${cell}: the kneeling ${side} hip is flexed ${hip.toFixed(1)} deg, at most 30 expected (provisional)`,
          hip <= 30,
        );
        if (kind === "both")
          complaints.check(
            `${cell}: the ${side} knee is flexed ${knee.toFixed(1)} deg, [70, 110] expected (provisional)`,
            knee >= 70 && knee <= 110,
          );
      }
    }
    if (kind === "one") {
      const knee: number = M.knee(s, t, up);
      const bears: boolean = M.bears(s, t, up);
      complaints.check(
        `${cell}: the front (${up}) knee is flexed ${knee.toFixed(1)} deg with its foot ${bears ? "down" : "up"}, [70, 110] and down expected (provisional)`,
        knee >= 70 && knee <= 110 && bears,
      );
    }
    const lean: number = M.trunk(s, t);
    complaints.check(
      `${cell}: trunk inclination ${lean.toFixed(1)} deg while kneeling, [-10, 15] expected (provisional)`,
      lean >= -10 && lean <= 15,
    );
  }
  const bodies: ReadonlySet<motionHumanBody.Name> = new Set(CELLS.map(
    (cell: M.ICell): motionHumanBody.Name => cell.name,
  ));
  for (const name of bodies)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the kneel has the signature of human kneeling");
}

/** Four distinct support geometries at the two stature limits. */
const CELLS: readonly M.ICell[] = [
  { row: "default", name: "m-large" },
  { row: "knee=left", name: "f-small" },
  { row: "kind=both", name: "m-large" },
  { row: "kind=sitBack", name: "f-small" },
];
