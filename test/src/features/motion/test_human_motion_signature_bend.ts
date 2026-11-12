import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import { HumanFoot } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Bending to reach low looks like the strategy it names, on the four extreme
 * bodies reaching with either hand, read at the law's `deepest`.
 *
 * Bounds and sources (Burgess-Limerick 2003, Appl Ergon 34:589, "Squat,
 * stoop, or something in between?"; the lifting-posture classification):
 * - A stoop keeps the legs nearly straight and folds at the hips and the
 *   trunk. Bound: knee flexion at most 30 degrees and trunk inclination at
 *   least 45 degrees (provisional thresholds of the classification).
 * - A squat folds the knees and keeps the trunk more upright. Bound: knee
 *   flexion at least 90 degrees and a trunk inclination below the stoop's
 *   on the same body.
 * - A semi squat lies between: knee flexion above the stoop's and below the
 *   squat's.
 * - Balance: a body bent still keeps its centre of mass over its feet
 *   (static equilibrium). Bound: the centre's margin inside both feet's soles
 *   not negative at `deepest`, both feet bearing.
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real bend law on real bodies and reads displayed joints, soles and the centre of mass; a stoop with bent knees, a squat with straight ones, strategies in the wrong order or a body balanced outside its feet fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The strategies are Burgess-Limerick's classification; the thresholds are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Three strategies, the automatic choice and both hands on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_bend(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES) {
    const knee: Record<string, number> = {};
    const lean: Record<string, number> = {};
    for (const row of [
      "strategy=stoop",
      "strategy=semiSquat",
      "strategy=squat",
      "strategy=auto",
      "side=left",
      "side=right",
    ]) {
      const cell: string = `bend ${row} ${name}`;
      const s: M.IStaged = M.stage("bend", row, name);
      const t: number = M.event(s, "deepest")!;
      knee[row] = (M.knee(s, t, "left") + M.knee(s, t, "right")) / 2;
      lean[row] = M.trunk(s, t);
      const bones = M.bones(s, t);
      const margin: number = resolveAutoMovieCenterOfMass.margin(
        resolveAutoMovieCenterOfMass.place(
          resolveAutoMovieCenterOfMass(s.body.skeleton, s.body.profile),
          bones,
        ),
        HumanFoot.base(s.body, bones),
      );
      complaints.check(
        `${cell}: at the deepest the centre of mass's margin inside the feet is ${(margin * 1000).toFixed(0)} mm with the feet ${M.bears(s, t, "left") && M.bears(s, t, "right") ? "down" : "not both down"}, not negative and down expected (static equilibrium)`,
        margin >= 0 && M.bears(s, t, "left") && M.bears(s, t, "right"),
      );
    }
    const k = (row: string): string => knee[row]!.toFixed(1);
    complaints.check(
      `bend ${name}: a stoop's knees ${k("strategy=stoop")} deg and trunk ${lean["strategy=stoop"]!.toFixed(1)} deg, knees at most 30 and trunk at least 45 expected (Burgess-Limerick 2003; provisional)`,
      knee["strategy=stoop"]! <= 30 && lean["strategy=stoop"]! >= 45,
    );
    complaints.check(
      `bend ${name}: a squat's knees ${k("strategy=squat")} deg and trunk ${lean["strategy=squat"]!.toFixed(1)} deg, knees at least 90 and the trunk below the stoop's expected (Burgess-Limerick 2003)`,
      knee["strategy=squat"]! >= 90 &&
        lean["strategy=squat"]! < lean["strategy=stoop"]!,
    );
    complaints.check(
      `bend ${name}: a semi squat's knees ${k("strategy=semiSquat")} deg between the stoop's ${k("strategy=stoop")} and the squat's ${k("strategy=squat")} expected (Burgess-Limerick 2003)`,
      knee["strategy=semiSquat"]! > knee["strategy=stoop"]! &&
        knee["strategy=semiSquat"]! < knee["strategy=squat"]!,
    );
  }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the bend has the signature of its strategy");
}
