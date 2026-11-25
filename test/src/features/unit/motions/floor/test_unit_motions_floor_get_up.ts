import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";
import { getUp } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

namespace part_get_up_half_kneeling {
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
  export function verify(): void {
    const right: IAutoMovieMotionHumanLieDown.IPose =
      getUp.halfKneeling("right");
    const left: IAutoMovieMotionHumanLieDown.IPose = getUp.halfKneeling("left");
    TestValidator.predicate("the key", right === getUp.POSES.halfKneel);
    // The key's mirrored joints, left with right.
    const pairs: readonly (readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone])[] = [
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
          ([l, r]: readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone]): boolean =>
            left.joints[l] === right.joints[r] &&
            left.joints[r] === right.joints[l],
        ),
    );
  }
}

/**
 * `getUp`'s unit contract: its half-kneeling route.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `get_up_half_kneeling`: `getUp.halfKneeling` is the half-kneeling key with a
 *   leading foot:
 */
export async function test_unit_motions_floor_get_up(): Promise<void> {
  part_get_up_half_kneeling.verify();
}
