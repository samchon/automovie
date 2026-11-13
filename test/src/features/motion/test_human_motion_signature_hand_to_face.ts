import type { IAutoMovieVector3 } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Bringing a hand to the face looks like the activity of daily living it
 * is, for each task and hand, read over the law's stroke (`strokeStart` to
 * `strokeEnd`).
 *
 * The rows are staged on the strength-1 covering array of rows and the four
 * extreme bodies (`motionHumanSignature.cells`): every row once and every
 * body at least once, so the cost grows with the rows and not with their
 * product with the bodies. The drinking posture at the lips, the one bound
 * read per body, is `test_human_motion_signature_hand_to_face_drink`'s,
 * staged on every body there.
 *
 * Bounds and sources (van Andel, Wolterbeek, Doorenbosch, Veeger and Harlaar
 * 2008, Gait Posture 27:120, the upper-extremity kinematics of functional
 * tasks; hand to mouth and combing hair):
 * - Elbow: bringing the hand to the mouth or the head folds the elbow
 *   deeply, to about 120 to 145 degrees. Bound: the acting elbow flexed at
 *   least 100 degrees at the middle of the stroke (provisional lower limit).
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
 * @evidence contracts/development/testing.md#distinguishing-cases Every task and both hands, each on one of the four extreme bodies and every body at least once.
 * @evidence contracts/development/testing.md#execution-ownership In memory, one film per row; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, the covering of rows and bodies and where the drinking bound went.
 */
export function test_human_motion_signature_hand_to_face(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  // A book is held before the face, not at it, and a toothbrush lengthens
  // the hand, so neither brings the hand itself to the face.
  const tasks: string[] = [
    "drink",
    "sip",
    "eat",
    "bite",
    "phone",
    "comb",
    "washFace",
    "wipeMouth",
  ];
  const rows: string[] = [
    "default",
    ...tasks.map((t: string): string => `task=${t}`),
    "side=left",
    "side=right",
  ];
  for (const { row, name } of M.cells(rows)) {
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
    const ts: number[] = M.times(from, Math.max(from, to), 30);
    const pitch: number[] = ts.map((t: number): number => M.head(s, t));
    const lean: number[] = ts.map((t: number): number => M.trunk(s, t));
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
