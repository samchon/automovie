import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanJoints,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * A joint writer adds clinical angles on its reserved bones.
 *
 * Scenarios:
 *
 * 1. Write a different delta on each axis and start an absent neck at zero.
 * 2. An unreserved spine write fails. The held posture remains available.
 */
function scenario_test_unit_motions_compose_joints_add(): void {
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

/**
 * Observe a joint pulse over its rise, hold and release from an asymmetric held
 * posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 */
function scenario_test_unit_motions_compose_joints_pulse(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(1, [
    { name: "apex", seconds: 0.25 },
    { name: "release", seconds: 0.75 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: -1 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [3, 5, -2], neck: [1, -4, 2] },
    limbs: {},
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanJoints.pulse(
      clock,
      ["start", "apex"],
      ["release", "end"],
      { head: [0, 20, 0] },
    );
  for (const [seconds, excursion] of [
    [0, 0],
    [0.125, 10],
    [0.25, 20],
    [0.75, 20],
    [0.875, 10],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["neck", "head"] as const) {
        const expected: number =
          entry.joints[joint]![axis] +
          (axis === 1 ? (joint === "head" ? excursion : 0) : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}

/**
 * AutoMovieMotionHumanJoints, the joint channels a law composes: its added
 * angles and its pulse, each scenario below.
 */
export function test_unit_motions_compose_joints(): void {
  scenario_test_unit_motions_compose_joints_add();
  scenario_test_unit_motions_compose_joints_pulse();
}
