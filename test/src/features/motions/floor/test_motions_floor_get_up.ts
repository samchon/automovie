import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";
import {
  getUp
} from "../../../../../packages/motions/src/floor/internal/getUp";
import { TestValidator } from "@nestia/e2e";

/**
 * `getUp.halfKneeling` is the half-kneeling key with a leading foot: the key
 * itself leading with the right, and its left and right sides exchanged leading
 * with the left.
 *
 * Scenarios:
 *
 * 1. Leading with the right is the key.
 * 2. Leading with the left, each left joint holds the key's right one and each
 *    right joint the key's left one, the tilt kept.
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
