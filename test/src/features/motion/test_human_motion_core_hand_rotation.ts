import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IHumanBody,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hand asked to turn about its forearm turns there: the arm fit meets a
 * hand goal's rotation by pronation and supination of the forearm, so a
 * held tool's line and edge go where they are aimed.
 *
 * The right wrist is placed ahead of the shoulder at chest height on a
 * standing body, first with no rotation asked, which gives the hand's own
 * rotation there. Then the hand is asked for that rotation turned about the
 * forearm's axis (elbow to wrist) by every angle from -180 to 180 degrees in
 * steps of 5.
 *
 * Scenarios, on the average man, the small woman and the long-armed man:
 * 1. The wrist stays on its place within 1 mm at every asked turn: turning
 *    the hand moves no joint centre of the arm's chain end.
 * 2. The asked turns that are met within 2 degrees form one run through 0
 *    that spans at least 120 degrees: the forearm's pronation and
 *    supination together cover about 160 degrees in clinical norms (about
 *    80 each way in the AAOS joint-motion norms, recalled and not read this
 *    round, so the 120 is provisional), and 120 leaves a margin below it.
 * 3. Continuity: from one asked turn to the next, 5 degrees apart, the
 *    displayed hand turns by no more than 8 degrees, inside the run and
 *    for 30 degrees past each of its ends, where the forearm stays at its
 *    limit. Farther round, an asked turn is nearer the other limit and the
 *    hand must change sides once (measured at 140 to 150 degrees, a turn of
 *    33 to 47 degrees), which no hand can avoid and is not judged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fits the arm through the posture resolver's public limb fit and reads the displayed hand and forearm bones; a rotation dropped, met only by moving the wrist, or met by a flip fails with the measured span and step.
 * @evidence contracts/development/testing.md#independent-expectations The asked rotation is built in the test from the displayed forearm axis; the span is the clinical range of forearm rotation less a margin (provisional until the norm is read), and the step bound is the asked step plus 3 degrees. None is read from the fit.
 * @evidence contracts/development/testing.md#distinguishing-cases Turns inside the range, at both limits and 30 degrees beyond them, on three builds. Rotations about the other two axes are the wrist's and are not swept here.
 * @evidence contracts/development/testing.md#execution-ownership Resolves postures of prepared polygon men in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the staging and the 3 scenarios with their bounds and source.
 */
export function test_human_motion_core_hand_rotation(): void {
  const complaints: string[] = [];
  const degrees = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
    (2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      ) *
      180) /
    Math.PI;
  for (const name of ["m-average", "f-small", "m-long-armed"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const standing: IAutoMoviePose = resolveHumanPosture(
      body,
      stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
    );
    const bone = (
      pose: IAutoMoviePose,
      which: AutoMovieHumanoidBone,
    ): IAutoMovieResolvedBone => poseBones(body, pose).get(which)!;
    const shoulder: IAutoMovieVector3 = bone(
      standing,
      "rightUpperArm",
    ).worldPosition;
    const reach: number =
      Vector3.length(
        Vector3.subtract(
          bone(standing, "rightLowerArm").worldPosition,
          shoulder,
        ),
      ) +
      Vector3.length(
        Vector3.subtract(
          bone(standing, "rightHand").worldPosition,
          bone(standing, "rightLowerArm").worldPosition,
        ),
      );
    const point: IAutoMovieVector3 = {
      x: shoulder.x,
      y: shoulder.y - 0.15 * reach,
      z: shoulder.z + 0.6 * reach,
    };
    const bend: IAutoMovieVector3 = {
      x: shoulder.x - 0.3 * reach,
      y: shoulder.y - 0.5 * reach,
      z: shoulder.z,
    };
    const free: IAutoMoviePose = resolveHumanPosture.limb(
      body,
      standing,
      "rightArm",
      { point, bend },
    );
    const own: IAutoMovieQuaternion = bone(free, "rightHand").worldRotation;
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        bone(free, "rightHand").worldPosition,
        bone(free, "rightLowerArm").worldPosition,
      ),
    );

    const rows: { turn: number; off: number; shown: IAutoMovieQuaternion }[] =
      [];
    let slid: { value: number; turn: number } = { value: 0, turn: 0 };
    for (let turn: number = -180; turn <= 180; turn += 5) {
      const asked: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(Quaternion.fromAxisAngle(axis, turn), own),
      );
      const fitted: IAutoMoviePose = resolveHumanPosture.limb(
        body,
        standing,
        "rightArm",
        { point, bend, rotation: asked },
      );
      const hand: IAutoMovieResolvedBone = bone(fitted, "rightHand");
      const moved: number = Vector3.length(
        Vector3.subtract(hand.worldPosition, point),
      );
      if (moved > slid.value) slid = { value: moved, turn };
      rows.push({
        turn,
        off: degrees(hand.worldRotation, asked),
        shown: hand.worldRotation,
      });
    }

    // 1. The wrist keeps its place.
    if (slid.value > 0.001)
      complaints.push(
        `${name}: the wrist lies ${(slid.value * 1000).toFixed(2)} mm off its place when the hand is asked to turn ${slid.turn} degrees, within 1 mm expected`,
      );

    // 2. The run of met turns through 0.
    const zero: number = rows.findIndex(
      (row: (typeof rows)[number]): boolean => row.turn === 0,
    );
    let low: number = zero;
    let high: number = zero;
    while (low > 0 && rows[low - 1]!.off <= 2) --low;
    while (high < rows.length - 1 && rows[high + 1]!.off <= 2) ++high;
    const span: number = rows[high]!.turn - rows[low]!.turn;
    if (rows[zero]!.off > 2 || span < 120)
      complaints.push(
        `${name}: asked turns about the forearm are met within 2 degrees from ${rows[low]!.turn} to ${rows[high]!.turn} degrees (${span} degrees; ${rows[zero]!.off.toFixed(1)} off at 0, ${rows[Math.max(0, low - 1)]!.off.toFixed(1)} off one step below, ${rows[Math.min(rows.length - 1, high + 1)]!.off.toFixed(1)} off one step above), a run of at least 120 degrees expected`,
      );

    // 3. No flip between neighbouring asked turns.
    let step: { value: number; turn: number } = { value: 0, turn: 0 };
    for (
      let i: number = Math.max(1, low - 5);
      i <= Math.min(rows.length - 1, high + 6);
      ++i
    ) {
      const value: number = degrees(rows[i]!.shown, rows[i - 1]!.shown);
      if (value > step.value) step = { value, turn: rows[i]!.turn };
    }
    if (step.value > 8)
      complaints.push(
        `${name}: between the asked turns ${step.turn - 5} and ${step.turn} degrees the displayed hand turns ${step.value.toFixed(1)} degrees, at most 8 expected`,
      );
  }
  TestValidator.equals(
    "a hand turns about its forearm as asked",
    complaints,
    [],
  );
}
