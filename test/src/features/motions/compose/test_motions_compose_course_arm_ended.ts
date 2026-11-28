import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import {
  courseArmGoalBase
} from "../../../../../packages/motions/src/compose/internal/courseArmGoalBase";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the left arm's terminal chain and the other pose joints that must be absent from the result.
 * @evidence contracts/development/testing.md#behavioral-verification Calls courseArmGoalBase.ended with a one-posture synthetic action at the authored terminal second, reading only the selected left arm.
 * @evidence contracts/development/testing.md#independent-expectations The input declares left upper arm angles (30, 10, 0) and forearm angles (45, 0, 0). The expected record consists of those two entries.
 */
export function test_motions_compose_course_arm_ended(): void {
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
