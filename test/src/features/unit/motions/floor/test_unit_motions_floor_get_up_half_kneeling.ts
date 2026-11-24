import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";
import { getUp } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `getUp.halfKneeling` is the half-kneeling key with a leading foot: the key
 * itself leading with the right, and its left and right sides exchanged
 * leading with the left.
 *
 * Scenarios:
 *
 * 1. Leading with the right is the key.
 * 2. Leading with the left, each left joint holds the key's right one and each
 *    right joint the key's left one, the tilt kept.
 */
export function test_unit_motions_floor_get_up_half_kneeling(): void {
  const right: IAutoMovieMotionHumanLieDown.IPose = getUp.halfKneeling("right");
  const left: IAutoMovieMotionHumanLieDown.IPose = getUp.halfKneeling("left");
  TestValidator.predicate(
    "the key",
    right === getUp.POSES.halfKneel,
  );
  const swapped = (bone: string): AutoMovieHumanoidBone =>
    (bone.startsWith("left")
      ? bone.replace(/^left/, "right")
      : bone.replace(/^right/, "left")) as AutoMovieHumanoidBone;
  TestValidator.predicate(
    "mirrored",
    left.pitch === right.pitch &&
      left.roll === right.roll &&
      (Object.keys(right.joints) as AutoMovieHumanoidBone[]).every(
        (bone: AutoMovieHumanoidBone): boolean =>
          left.joints[swapped(bone)] === right.joints[bone],
      ),
  );
}
