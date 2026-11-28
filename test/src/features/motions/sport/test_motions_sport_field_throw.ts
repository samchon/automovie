import type { IAutoMovieMotionHumanExerciseKey } from "@automovie/interface";
import {
  fieldThrowKeys
} from "../../../../../packages/motions/src/sport/internal/fieldThrowKeys";
import { TestValidator } from "@nestia/e2e";

/**
 * `fieldThrowKeys.blend` interpolates two throw keys linearly: tip, roll, yaw,
 * lift and every joint either names, a joint one leaves out standing at zero.
 *
 * Scenarios:
 *
 * 1. A quarter of the way from a key with the elbow at 80 to one with the knee at
 *    40 and a 20 degree tip: elbow 60, knee 10, tip 5.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines linear key blending for trunk, lift and all joints named by either key.
 * @evidence contracts/development/testing.md#behavioral-verification Blends two posed keys at quarter progress whose elbow and knee occur in only one key each.
 * @evidence contracts/development/testing.md#independent-expectations The 80° elbow fades toward zero to 60°, the 40° knee rises from zero to 10°, and the 20° tip gives 5°.
 */
export function test_motions_sport_field_throw(): void {
  const a: IAutoMovieMotionHumanExerciseKey.IKey = {
    pitch: 0,
    roll: 0,
    yaw: 0,
    lift: 0,
    joints: { rightLowerArm: [80, 0, 0] },
  };
  const b: IAutoMovieMotionHumanExerciseKey.IKey = {
    pitch: 20,
    roll: 4,
    yaw: -8,
    lift: 0.1,
    joints: { leftLowerLeg: [40, 0, 0] },
  };
  TestValidator.equals(
    "a quarter of the way",
    fieldThrowKeys.blend(a, b, 0.25),
    {
      pitch: 5,
      roll: 1,
      yaw: -2,
      lift: 0.025,
      joints: { rightLowerArm: [60, 0, 0], leftLowerLeg: [10, 0, 0] },
    },
  );
}
