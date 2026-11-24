import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanJoints } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * A joint writer adds clinical angles on its reserved bones.
 *
 * Scenarios:
 *
 * 1. Write a different delta on each axis and start an absent neck at zero.
 * 2. An unreserved spine write fails. The held posture remains available.
 */
export function test_unit_motions_compose_joints_add(): void {
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
