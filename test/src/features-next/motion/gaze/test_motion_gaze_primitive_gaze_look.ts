import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  resolvePose,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanGaze } from "@automovie/motions";
import { resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/**
 * Both displayed eye axes follow an offset world target at the requested gaze weight.
 *
 * Scenarios:
 * 1. Place landmarks to either side of a neutral actor, within comfortable ocular range.
 * 2. Check both visual rays against the line from each eye to that landmark.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the eye origin and the world target used to compute the expected direction.
 * @evidence contracts/development/testing.md#independent-expectations The expected unit ray is the normalized difference of two world points. At zero weight the neutral actor faces positive Z.
 * @evidence contracts/development/testing.md#behavioral-verification Compares both forward vectors from actual resolved eye rotations with independent landmark rays.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite horizontal offsets require opposite eye turns. The actor's torso stays at its supplied orientation.
 * @evidence contracts/development/testing.md#execution-ownership Uses one polygon body with one gaze writer per supplied landmark.
 */
export function test_motion_gaze_primitive_gaze_look(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  for (const lateral of [-0.4, 0.6]) {
    const target: IAutoMovieVector3 = {
      x: lateral,
      y: body.rest.get("leftEye")!.y,
      z: 3,
    };
    const primitive: IAutoMovieMotionHumanPrimitive =
      AutoMovieMotionHumanGaze.lookPrimitive({
        body,
        from: 0,
        to: 1,
        recruit: "eyes",
        target: () => target,
        weight: () => 1,
      });
    for (const seconds of [0.5]) {
      const posed: IAutoMovieMotionHumanPosture = primitive.write(
        entry,
        seconds,
      );
      TestValidator.equals(
        "fixed torso",
        [posed.yaw, posed.pitch, posed.roll],
        [0, 0, 0],
      );
      const bones: IAutoMovieResolvedBone[] = resolvePose(
        resolveHumanPosture(body, posed),
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      );
      for (const name of ["leftEye", "rightEye"] as const) {
        const eye: IAutoMovieResolvedBone = bones.find(
          (bone) => bone.bone === name,
        )!;
        const { x, y, z, w } = eye.worldRotation;
        const forward: IAutoMovieVector3 = {
          x: 2 * (x * z + w * y),
          y: 2 * (y * z - w * x),
          z: 1 - 2 * (x * x + y * y),
        };
        const dx = target.x - eye.worldPosition.x,
          dy = target.y - eye.worldPosition.y,
          dz = target.z - eye.worldPosition.z;
        const length: number = Math.hypot(dx, dy, dz);
        const expected: IAutoMovieVector3 =
          seconds === 0 || seconds === 1
            ? { x: 0, y: 0, z: 1 }
            : { x: dx / length, y: dy / length, z: dz / length };
        TestValidator.predicate(
          name + " at " + seconds,
          vclose(forward, expected, 1e-9),
        );
      }
    }
  }
}
