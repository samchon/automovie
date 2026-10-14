import type {
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateMotion } from "@automovie/engine";
import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";

/**
 * Exercise keyframe pose skeleton identity independently of the enclosing motion's valid rig identity.
 *
 * Scenarios:
 * 1. The first keyframe pose names skeleton-2 while the motion and target rig name skeleton-1; validation fails beneath that keyframe pose.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion with a mismatched first pose identity and requires the exact keyframe pose.skeleton type finding, catching validation of only the enclosing clip identity.
 * @evidence contracts/testing.md#independent-expectations Each pose must reference the supplied target rig; literal unequal identities and the first-key address determine the expected refusal without sampling.
 * @evidence contracts/testing.md#distinguishing-cases Retains matching clip/target identities and a matching second pose; motion_skeleton_id owns the enclosing identity mismatch and motion_valid owns complete admission.
 * @evidence contracts/testing.md#execution-ownership The named unit uses existing portable pose/keyframe/rig factories, with no rig binding host or dynamic registration.
 */
export function test_validation_motion_keyframe_skeleton(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const result: IAutoMovieValidation = validateMotion({
    motion: makeMotion(
      [
        keyframe(0, {
          ...makePose([joint("leftLowerArm", { flexion: 0 })]),
          skeleton: "skeleton-2",
        }),
        keyframe(1, makePose([joint("leftLowerArm", { flexion: 30 })])),
      ],
      1,
    ),
    skeleton,
  });
  TestValidator.equals(
    "mismatched keyframe pose skeleton fails",
    result.success,
    false,
  );
  TestValidator.predicate(
    "type violation on keyframe pose skeleton",
    hasViolation(result, "type", "$input.keyframes[0].pose.skeleton"),
  );
}
