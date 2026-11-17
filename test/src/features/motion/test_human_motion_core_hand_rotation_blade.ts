import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones, resolveHumanPosture, stand } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hand goal's full rotation is met as a body meets it (#3411): the part
 * about the forearm's axis by the forearm's turn within its range, so a held
 * tool's line and edge point where the goal asks.
 *
 * Scenarios, on the shortest and the tallest body, the right hand placed
 * ahead of the chest (0.35 m ahead of the shoulder and 0.15 m below it) with
 * the elbow bending down and out. The hand's own rotation there with no
 * rotation asked is turned about the displayed forearm's axis (elbow to
 * wrist) by -60, -30, 0, 30 and 60 degrees, turns inside the forearm's
 * pronation and supination (about 80 degrees each way), and asked:
 * 1. The wrist lies on its goal within 1 mm, the limb fit's own convergence
 *    scale (`KickForm.TOLERANCE`).
 * 2. The hand's rotation meets the goal within 0.955 degrees: the angle a
 *    15 mm miss at a 0.9 m blade's point subtends, #3411's bound at the
 *    point.
 * 3. The turn is not dropped: the hand's rotation follows the asked turn,
 *    each step of 30 degrees read back within the same bound.
 *
 * This is #3411's bound on `test_human_motion_core_hand_rotation`'s
 * construction, whose 2 degrees would let a 0.9 m blade's point stray 31 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves a standing posture with a hand goal through the public resolver and reads the displayed hand; a wrist off its goal or a rotation missed fails with the body, the turn and the miss.
 * @evidence contracts/development/testing.md#independent-expectations The rotation bound is #3411's 15 mm at a 0.9 m blade's point; the wrist bound is the limb fit's convergence scale; the turns are about the displayed forearm's own axis and lie inside its range.
 * @evidence contracts/development/testing.md#distinguishing-cases Five turns either way of the rest on two bodies of opposite size.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and resolves ten postures, under a few seconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the invariant, its bounds with their sources and the 3 scenarios.
 */
export function test_human_motion_core_hand_rotation_blade(): void {
  const complaints: string[] = [];
  const degrees = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
    (2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      ) *
      180) /
    Math.PI;
  const bound: number = (Math.atan(0.015 / 0.9) * 180) / Math.PI;
  for (const name of ["f-small", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const standing: IAutoMovieMotionHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const restBones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, standing),
    );
    const shoulder: IAutoMovieVector3 =
      restBones.get("rightUpperArm")!.worldPosition;
    const point: IAutoMovieVector3 = Vector3.add(shoulder, {
      x: 0,
      y: -0.15,
      z: 0.35,
    });
    const bend: IAutoMovieVector3 = Vector3.add(shoulder, {
      x: -0.3,
      y: -0.4,
      z: 0.1,
    });

    // The hand's own rotation at the goal with none asked, and the displayed
    // forearm's axis there (elbow to wrist), which the asked turns are about.
    const free: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, {
        ...standing,
        limbs: { ...standing.limbs, rightArm: { point, bend } },
      }),
    );
    const rest: IAutoMovieQuaternion = free.get("rightHand")!.worldRotation;
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        free.get("rightHand")!.worldPosition,
        free.get("rightLowerArm")!.worldPosition,
      ),
    );
    let previous: IAutoMovieQuaternion | undefined;
    for (const turn of [-60, -30, 0, 30, 60]) {
      const asked: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(Quaternion.fromAxisAngle(axis, turn), rest),
      );
      const posture: IAutoMovieMotionHumanPosture = {
        ...standing,
        limbs: {
          ...standing.limbs,
          rightArm: { point, bend, rotation: asked },
        },
      };
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, posture),
      );
      const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
      const got: IAutoMovieQuaternion = bones.get("rightHand")!.worldRotation;
      const off: number = Vector3.length(Vector3.subtract(wrist, point));
      if (off > 1e-3)
        complaints.push(
          `${name} turn ${turn}: the wrist lies ${(off * 1000).toFixed(1)} mm off its goal`,
        );
      const miss: number = degrees(got, asked);
      if (miss > bound)
        complaints.push(
          `${name} turn ${turn}: the hand misses its rotation by ${miss.toFixed(2)} degrees`,
        );
      if (previous !== undefined) {
        const step: number = degrees(got, previous);
        if (Math.abs(step - 30) > bound)
          complaints.push(
            `${name} turn ${turn}: the hand turned ${step.toFixed(2)} degrees for a 30 degree step`,
          );
      }
      previous = got;
    }
  }
  TestValidator.equals(
    "a hand goal's rotation is met by the forearm's turn",
    complaints,
    [],
  );
}
