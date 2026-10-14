import { validateMotion } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";

/**
 * Exercise default pose-range admission beneath each motion keyframe; the engine's baseline constraints do not certify population-specific anatomy.
 *
 * Scenarios:
 * 1. A clip whose second keyframe bends the elbow to 175 degrees fails with a rom violation beneath the keyframe path.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion and requires a keyframe-rooted rom finding for excessive elbow flexion, catching a clip gate that skips its pose validator.
 * @evidence contracts/testing.md#independent-expectations The declared default elbow interval ends at 150 degrees, so 175 exceeds it; expectations concern admission and provenance, not sampled joint geometry.
 * @evidence contracts/testing.md#distinguishing-cases Retains a supported first elbow pose and unsupported second pose; motion_valid supplies supported moving keys and pose_override owns authored constraint precedence.
 * @evidence contracts/testing.md#execution-ownership This named portable unit validates the existing conventional rig and clip records without Human modeling, FK sampling or a GPU.
 */
export function test_validation_motion_keyframe_rom(): void {
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 175 })])),
    ],
    1,
  );
  const result: IAutoMovieValidation = validateMotion({
    motion,
    skeleton: createSkeleton(),
  });
  TestValidator.equals("bad keyframe pose fails", result.success, false);
  TestValidator.predicate(
    "rom violation under a keyframe",
    hasViolation(result, "rom", "keyframes["),
  );
}
