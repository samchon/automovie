import type { AutoMovieHumanSide, IAutoMovieMotionHumanKneel } from "@automovie/interface";

import type { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanSignature as M } from "./motionHumanSignature";
import { motionPostureBranches } from "./motionPostureBranches";

/**
 * A settled kneel has the geometry of one knee, both knees or the seated
 * posture on the heels, read between `settled` and `kneeOff` or the held exit.
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
 * @param complaints The owning test's geometry findings.
 * @param film The exact performed film the test already audits.
 * @param name The body in the solo film, facing +Z.
 * @param kind The staged kneeling mode.
 * @param down The staged or default bearing knee of a half-kneel.
 * @param rise Whether the film stands up after holding the posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every posture and bound with its status.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the displayed knees, hips, trunk and soles midway through the prescribed held support. The limits come from the standard kneeling arrangements.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One geometry read for each bearing knee, with a distinct front-foot read on a half-kneel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failure keeps its stance, body, measured value and original provisional limit.
 * @evidence contracts/development/implementation.md#efficient-algorithms One held second serves all joint angle checks. A supporting front foot uses the existing near-and-still observation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same actual film as the full transition audit.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after the call.
 */
export function motionKneelSignature(
  complaints: motionComplaints.IGatherer,
  film: motionHumanLaw.IFilm,
  name: motionHumanBody.Name,
  kind: IAutoMovieMotionHumanKneel.Kind,
  down: AutoMovieHumanSide = "right",
  rise: boolean = true,
): void {
  const cell: string = `kneel ${kind} ${down} ${name}`;
  motionPostureBranches.checkBase(complaints.list, film.performance, cell, rise ? "standing" : "kneeling");
  const s: M.IStaged = { film, body: motionHumanBody(name), yaw: 0 };
  const settled: number = motionHumanLaw.event(film, "settled");
  const release: number = rise ? motionHumanLaw.event(film, "kneeOff") : film.duration;
  const t: number = (settled + release) / 2;
  const height: (side: AutoMovieHumanSide) => number = (side: AutoMovieHumanSide): number =>
    M.joint(s, t, `${side}LowerLeg`).y;
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
