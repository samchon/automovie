import type { IAutoMovieVector3 } from "@automovie/interface";

import { motionComplaints } from "./motionComplaints";
import type { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * Bringing a hand to the face looks like the activity of daily living it
 * is, for each task and hand of the hand-to-face law, on one body, read over
 * the law's stroke (`strokeStart` to `strokeEnd`); the
 * `test_human_motion_signature_hand_to_face_rows_*` specs run one extreme
 * body each over half the rows (`MOUTH` and `HEAD`), so every row is read on
 * every body and each spec runs alone in its time. The drinking posture at the lips is the
 * `test_human_motion_signature_hand_to_face_drink_*` specs'.
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
 * A book is held before the face, not at it, and a toothbrush lengthens the
 * hand, so neither `read` nor `brushTeeth` brings the hand itself to the
 * face, and neither is a row here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, the trunk's reading and its calibration, the rows left out and why, and where the drinking bound is.
 * @evidence contracts/development/implementation.md#principled-implementation Performs the real law on a real body and reads displayed joints through the signature readers.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the rows, each staged and read, then the calibration, gathered and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every row is read on the body; none is sampled away for time.
 * @evidence contracts/development/implementation.md#efficient-algorithms One film per row on one body, five or six rows a call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films live as long as the call.
 */
export namespace motionHandToFaceRows {
  /** The rows at the mouth: the default task and the five that bring the hand to the lips. */
  export const MOUTH: readonly string[] = [
    "default",
    "task=drink",
    "task=sip",
    "task=eat",
    "task=bite",
    "task=wipeMouth",
  ];

  /** The other rows: the tasks at the ear and the head, and both hands of the default task. */
  export const HEAD: readonly string[] = [
    "task=phone",
    "task=comb",
    "task=washFace",
    "side=left",
    "side=right",
  ];

  /**
   * Read rows on one body and assert the bounds; the quiet stance's trunk
   * calibration with the mouth's rows.
   *
   * @param name The body.
   * @param rows The rows, `MOUTH` or `HEAD`.
   */
  export function check(
    name: motionHumanBody.Name,
    rows: readonly string[],
  ): void {
    const complaints: motionComplaints.IGatherer = motionComplaints();
    for (const row of rows) {
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
    if (rows === MOUTH)
      for (const c of M.calibrate(name)) complaints.check(c, false);
    complaints.assert(
      `the hand comes to the face as people bring it (${name})`,
    );
  }
}
