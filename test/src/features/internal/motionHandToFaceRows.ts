import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionComplaints } from "./motionComplaints";
import type { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * Bringing a hand to the face looks like the activity of daily living it
 * is, for each task and hand of the hand-to-face law, on one body, read over
 * the law's stroke (`strokeStart` to `strokeEnd`). The small and large
 * bodies exercise mouth and head paths, respectively. The implied drink
 * and sip share their films with the more specific drinking checks.
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
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds apply over the original 30 Hz window. The acting arm comes from the displayed hand or the named side.
 * @evidence contracts/development/implementation.md#efficient-algorithms One film per task branch and a single pose read for both head pitch and trunk inclination at each instant.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The drinking spec also reads the generic bounds from its implied-prop films.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films live as long as the call.
 */
export namespace motionHandToFaceRows {
  /**
   * The remaining rows at the mouth. The drink and sip are read in the
   * focused drinking spec.
   * The row that leaves the task is not read apart: the hand-to-face stage
   * names the drink itself when the row leaves it (`MOTION_HUMAN_LAW_STAGES`),
   * so its film would repeat `task=drink`'s.
   */
  export const MOUTH: readonly string[] = [
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
      expectStroke(
        complaints,
        cell,
        s,
        row === "side=left"
          ? "left"
          : row === "side=right"
            ? "right"
            : undefined,
      );
    }
    for (const c of M.calibrate(name)) complaints.check(c, false);
    complaints.assert(
      `the hand comes to the face as people bring it (${name})`,
    );
  }

  /** Read the shared bounds from a film staged by either spec. */
  export function expectStroke(
    complaints: motionComplaints.IGatherer,
    cell: string,
    staged: M.IStaged,
    named?: AutoMovieHumanSide,
  ): void {
    const from: number = M.event(staged, "strokeStart")!;
    const to: number = M.event(staged, "strokeEnd")!;
    const mid: number = (from + to) / 2;
    const centre: ReturnType<typeof M.bones> = M.bones(staged, mid);
    const side: AutoMovieHumanSide =
      named ??
      (centre.get("leftHand")!.worldPosition.y >
      centre.get("rightHand")!.worldPosition.y
        ? "left"
        : "right");
    const elbow: number = M.flexion(
      centre.get(`${side}UpperArm`)!.worldPosition,
      centre.get(`${side}LowerArm`)!.worldPosition,
      centre.get(`${side}Hand`)!.worldPosition,
    );
    complaints.check(
      `${cell}: the ${side} elbow is flexed ${elbow.toFixed(1)} deg mid-stroke, at least 100 expected (van Andel et al. 2008; provisional)`,
      elbow >= 100,
    );
    const pitch: number[] = [];
    const lean: number[] = [];
    const forward: IAutoMovieVector3 = M.forward(staged.yaw);
    // The previous signature reads use a 30 Hz probe over sustained strokes.
    for (const time of M.times(from, Math.max(from, to), 30)) {
      const bones: ReturnType<typeof M.bones> =
        time === mid ? centre : M.bones(staged, time);
      const headAxis: IAutoMovieVector3 = Quaternion.rotateVector(
        bones.get("head")!.worldRotation,
        { x: 0, y: 0, z: 1 },
      );
      pitch.push(
        (Math.asin(Math.max(-1, Math.min(1, -headAxis.y))) * 180) / Math.PI,
      );
      const shoulders: IAutoMovieVector3 = Vector3.add(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
      );
      const hips: IAutoMovieVector3 = Vector3.add(
        bones.get("leftUpperLeg")!.worldPosition,
        bones.get("rightUpperLeg")!.worldPosition,
      );
      // A common factor of two cancels in the projection angle.
      const trunk: IAutoMovieVector3 = Vector3.subtract(shoulders, hips);
      lean.push(
        (Math.atan2(Vector3.dot(trunk, forward), trunk.y) * 180) / Math.PI,
      );
    }
    const minPitch: number = Math.min(...pitch);
    const maxPitch: number = Math.max(...pitch);
    const minLean: number = Math.min(...lean);
    const maxLean: number = Math.max(...lean);
    complaints.check(
      `${cell}: head pitch ${minPitch.toFixed(1)} to ${maxPitch.toFixed(1)} deg over the stroke, [-20, 30] expected (provisional)`,
      minPitch >= -20 && maxPitch <= 30,
    );
    complaints.check(
      `${cell}: trunk inclination ${minLean.toFixed(1)} to ${maxLean.toFixed(1)} deg over the stroke, [-10, 15] expected (provisional)`,
      minLean >= -10 && maxLean <= 15,
    );
  }
}
