import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";
import {
  getUp
} from "../../../../../packages/motions/src/floor/internal/getUp";
import { TestValidator } from "@nestia/e2e";

/**
 * Check which leg leads the half-kneeling get-up pose.
 *
 * Scenarios:
 *
 * 1. A right lead returns the authored right half-kneel.
 * 2. A left lead exchanges the corresponding leg joints and retains the root
 *    pitch and roll.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish the leading sides and identify the root angles that stay fixed.
 * @evidence contracts/development/testing.md#behavioral-verification The two lead choices select the expected half-kneeling shape and attitude.
 * @evidence contracts/development/testing.md#independent-expectations The test compares with the authored right table and a direct exchange of its corresponding leg joints.
 */
export async function test_motions_floor_get_up(): Promise<void> {
  const right: IAutoMovieMotionHumanLieDown.IPose = getUp.halfKneeling("right");
  const left: IAutoMovieMotionHumanLieDown.IPose = getUp.halfKneeling("left");
  TestValidator.predicate("the key", right === getUp.POSES.halfKneel);
  // The key's mirrored joints, left with right.
  const pairs: readonly (readonly [
    AutoMovieHumanoidBone,
    AutoMovieHumanoidBone,
  ])[] = [
    ["leftUpperLeg", "rightUpperLeg"],
    ["leftLowerLeg", "rightLowerLeg"],
    ["leftFoot", "rightFoot"],
    ["leftUpperArm", "rightUpperArm"],
    ["leftIndexProximal", "rightIndexProximal"],
  ];
  TestValidator.predicate(
    "mirrored",
    left.pitch === right.pitch &&
      left.roll === right.roll &&
      pairs.every(
        ([l, r]: readonly [
          AutoMovieHumanoidBone,
          AutoMovieHumanoidBone,
        ]): boolean =>
          left.joints[l] === right.joints[r] &&
          left.joints[r] === right.joints[l],
      ),
  );
}
