import type { IAutoMovieVector3 } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Bringing a hand to the face looks like the activity of daily living it
 * is, on the four extreme bodies for each task and hand, read over the
 * law's stroke (`strokeStart` to `strokeEnd`).
 *
 * Bounds and sources (van Andel, Wolterbeek, Doorenbosch, Veeger and Harlaar
 * 2008, Gait Posture 27:120, the upper-extremity kinematics of functional
 * tasks; hand to mouth and combing hair):
 * - Elbow: bringing the hand to the mouth or the head folds the elbow
 *   deeply, to about 120 to 145 degrees. Bound: the acting elbow flexed at
 *   least 100 degrees at the middle of the stroke (provisional lower limit).
 * - Drinking: a glass is brought to the mouth with the shoulder raised about
 *   40 to 50 degrees, the elbow low and in front of the body and the
 *   forearm near vertical, not saluting at the forehead (Murphy, Willén and
 *   Sunnerhagen 2011, Neurorehabil Neural Repair 25:71, drinking from a
 *   glass). Bound: for drink and sip at `atMouth`, the upper arm raised at
 *   most 70 degrees from hanging, the elbow at least 50 mm below the
 *   shoulder joint, and the wrist within a hand length of the mouth region
 *   (provisional limits).
 * - Head: the face is not turned up or away to meet the hand; the hand
 *   comes to it. Bound: head pitch in [-20, 30] degrees over the stroke
 *   (provisional; down positive).
 * - Trunk: the task is done standing upright. Bound: trunk inclination in
 *   [-10, 15] degrees over the stroke (provisional).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law on real bodies and reads displayed joints; a hand brought to the face on a straight arm, a head craned up to meet it or a body leaning far fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The elbow's range is van Andel et al.'s; the other limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Every task and both hands on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_hand_to_face(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const tasks: string[] = [
    "drink",
    "sip",
    "eat",
    "bite",
    "phone",
    "read",
    "brushTeeth",
    "comb",
    "washFace",
    "wipeMouth",
  ];
  for (const name of motionHumanBody.EXTREMES)
    for (const row of [
      "default",
      ...tasks.map((t) => `task=${t}`),
      "side=left",
      "side=right",
    ]) {
      // A book is held before the face, not at it, and a toothbrush lengthens
      // the hand, so neither brings the hand itself to the face.
      if (row === "task=read" || row === "task=brushTeeth") continue;
      const cell: string = `handToFace ${row} ${name}`;
      const s: M.IStaged = M.stage("handToFace", row, name);
      const from: number = M.event(s, "strokeStart")!;
      const to: number = M.event(s, "strokeEnd")!;
      const mid: number = (from + to) / 2;
      const rise = (side: "left" | "right"): number => {
        const p: IAutoMovieVector3 = M.joint(s, mid, `${side}Hand`);
        return p.y;
      };
      const side: "left" | "right" =
        row === "side=left"
          ? "left"
          : row === "side=right"
            ? "right"
            : rise("left") > rise("right")
              ? "left"
              : "right";
      const elbow: number = M.elbow(s, mid, side);
      complaints.check(
        `${cell}: the ${side} elbow is flexed ${elbow.toFixed(1)} deg mid-stroke, at least 100 expected (van Andel et al. 2008; provisional)`,
        elbow >= 100,
      );
      // Drinking: the cup at the lips, the elbow low and in front.
      if (row === "default" || row === "task=drink" || row === "task=sip") {
        const at: number = M.event(s, "atMouth") ?? from;
        const shoulder: IAutoMovieVector3 = M.joint(s, at, `${side}UpperArm`);
        const knuckle: IAutoMovieVector3 = M.joint(s, at, `${side}LowerArm`);
        const hand: IAutoMovieVector3 = M.joint(s, at, `${side}Hand`);
        const arm: IAutoMovieVector3 = {
          x: knuckle.x - shoulder.x,
          y: knuckle.y - shoulder.y,
          z: knuckle.z - shoulder.z,
        };
        const elevation: number =
          (Math.acos(-arm.y / Math.hypot(arm.x, arm.y, arm.z)) * 180) / Math.PI;
        complaints.check(
          `${cell}: at the mouth (${at.toFixed(2)} s) the upper arm is raised ${elevation.toFixed(1)} deg from hanging and the elbow stands ${((shoulder.y - knuckle.y) * 1000).toFixed(0)} mm below the shoulder, at most 70 deg and at least 50 mm below expected (Murphy et al. 2011; provisional)`,
          elevation <= 70 && shoulder.y - knuckle.y >= 0.05,
        );
        const mouth: IAutoMovieVector3 = M.region(s, "a", s.body, "mouth", at);
        const gap: number = Math.hypot(
          hand.x - mouth.x,
          hand.y - mouth.y,
          hand.z - mouth.z,
        );
        complaints.check(
          `${cell}: at the mouth (${at.toFixed(2)} s) the wrist is ${(gap * 1000).toFixed(0)} mm from the mouth, within a hand length (${(s.body.measure.hand * 1000).toFixed(0)} mm) expected`,
          gap <= s.body.measure.hand,
        );
      }
      const ts: number[] = M.times(from, Math.max(from, to), 30);
      const pitch: number[] = ts.map((t) => M.head(s, t));
      const lean: number[] = ts.map((t) => M.trunk(s, t));
      complaints.check(
        `${cell}: head pitch ${Math.min(...pitch).toFixed(1)} to ${Math.max(...pitch).toFixed(1)} deg over the stroke, [-20, 30] expected (provisional)`,
        Math.min(...pitch) >= -20 && Math.max(...pitch) <= 30,
      );
      complaints.check(
        `${cell}: trunk inclination ${Math.min(...lean).toFixed(1)} to ${Math.max(...lean).toFixed(1)} deg over the stroke, [-10, 15] expected (provisional)`,
        Math.min(...lean) >= -10 && Math.max(...lean) <= 15,
      );
    }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the hand comes to the face as people bring it");
}
