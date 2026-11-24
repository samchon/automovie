import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanJoints } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../../features/internal/throwsError";

/**
 * A joint writer adds clinical angles on its reserved bones.
 *
 * Scenarios:
 * 1. Write a different delta on each axis and start an absent neck at zero.
 * 2. An unreserved spine write fails. The held posture remains available.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the coordinate system and channel ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Observes public writes and out-of-channel refusal.
 * @evidence contracts/development/testing.md#independent-expectations The expected head tuple is the componentwise sum of the input triples.
 * @evidence contracts/development/testing.md#distinguishing-cases Held, absent, untouched and forbidden bones exercise distinct cases.
 * @evidence contracts/development/testing.md#execution-ownership Runs one primitive against a literal posture with no scene.
 */
export function test_motion_posture_primitive_joints_add(): void {
  const pose: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [10, 3, -4], spine: [1, 2, 3] },
    limbs: {},
  };
  const part: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanJoints.add({
    channels: ["head"],
    from: 0,
    to: 1,
    delta: (seconds: number) =>
      seconds === 0
        ? { head: [-3, 4, 1], neck: [1, -2, 3] }
        : { spine: [1, 0, 0] },
  });
  TestValidator.equals(
    "held, absent and untouched clinical angles",
    part.write(pose, 0).joints,
    { head: [7, 7, -3], neck: [1, -2, 3], spine: [1, 2, 3] },
  );
  TestValidator.predicate(
    "spine belongs to the trunk",
    throwsError(() => part.write(pose, 1)),
  );
  TestValidator.equals("entry remains reusable", pose.joints.head, [10, 3, -4]);
}
