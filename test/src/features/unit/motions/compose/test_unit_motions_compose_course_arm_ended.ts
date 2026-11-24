import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { courseArmGoalBase } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPlan } from "../../../internal/synthetic/syntheticHumanPlan";

/** A posture with both arms and a knee bent. */
const POSTURE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {
    leftUpperArm: [30, 10, 0],
    leftLowerArm: [45, 0, 0],
    rightUpperArm: [-20, 5, 0],
    leftLowerLeg: [60, 0, 0],
  },
  limbs: {},
};

/**
 * `courseArmGoalBase.ended` reads an arm's angles off a coursed composition
 * where the arm's course ends: that arm's chain alone.
 *
 * The composition holds one posture with both arms and a knee bent.
 *
 * Scenarios:
 *
 * 1. The left arm's ending angles are its upper arm's and forearm's, and no other
 *    bone's.
 */
export function test_unit_motions_compose_course_arm_ended(): void {
  TestValidator.equals(
    "the arm's own chain where its course ends",
    courseArmGoalBase.ended(
      syntheticHumanPlan({ duration: 2, posture: POSTURE }),
      1.5,
      "left",
    ),
    { leftUpperArm: [30, 10, 0], leftLowerArm: [45, 0, 0] },
  );
}
