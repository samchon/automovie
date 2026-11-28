import type { IAutoMoviePose } from "@automovie/interface";
import {
  galleryCaseFist
} from "../../../../../packages/motions/src/executable/cases/internal/galleryCaseFist";
import {
  galleryCaseZero
} from "../../../../../packages/motions/src/executable/cases/internal/galleryCaseZero";
import { TestValidator } from "@nestia/e2e";

/**
 * The gallery's clinical poses: every bone at zero but those set, and a fist.
 *
 * Scenarios:
 *
 * 1. On a three-bone skeleton with the left elbow flexed 90 degrees and twisted
 *    10, the pose has no root and holds the other bones at zero, in order.
 * 2. The left fist sets its fourteen finger and thumb joints, each finger's
 *    proximal 85 degrees and the thumb's distal 50, and nothing of the right
 *    hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines zero-default gallery joint maps and the gallery fist on the requested side.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the pose builder with a three-bone map and explicit elbow override, then opens the left-fist joint map.
 * @evidence contracts/development/testing.md#independent-expectations The elbow values remain 90° flexion and 10° twist and other bones keep ordered zeros. The 14-joint fist contains the stated finger levels and omits right-hand joints.
 */
export function test_motions_executable_gallery_cases(): void {
  const pose: IAutoMoviePose = galleryCaseZero(
    {
      skeleton: {
        id: "rig",
        bones: [{ bone: "hips" }, { bone: "leftLowerArm" }, { bone: "head" }],
      },
    },
    { leftLowerArm: [90, 0, 10] },
  );
  TestValidator.equals("the zero pose", pose, {
    skeleton: "rig",
    root: null,
    joints: [
      { bone: "hips", flexion: 0, abduction: 0, twist: 0 },
      { bone: "leftLowerArm", flexion: 90, abduction: 0, twist: 10 },
      { bone: "head", flexion: 0, abduction: 0, twist: 0 },
    ],
  });
  const fist: ReturnType<typeof galleryCaseFist> = galleryCaseFist("left");
  TestValidator.equals(
    "the fist's joints",
    [
      Object.keys(fist).length,
      fist.leftIndexProximal,
      fist.leftThumbDistal,
      fist.rightIndexProximal,
    ],
    [14, [85, 0, 0], [50, 0, 0], undefined],
  );
}
