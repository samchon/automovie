import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validatePoseResult } from "@automovie/engine";
import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";

/**
 * Exercise finite degree-valued joint-axis admission before range comparisons.
 *
 * Scenarios:
 *
 * 1. NaN flexion on an otherwise ROM-constrained elbow is rejected.
 * 2. The violation points at the exact joint axis field.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validatePoseResult with NaN elbow flexion and requires the exact range finding, catching a comparison-only gate that silently admits NaN.
 * @evidence contracts/testing.md#independent-expectations Non-null axis values must be finite degrees; NaN has no ordered position in a supported interval, independently of the engine's comparison result.
 * @evidence contracts/testing.md#distinguishing-cases Owns nonfinite flexion on a declared constrained bone; pose_valid supplies finite acceptance and pose_rom owns finite excessive flexion.
 * @evidence contracts/testing.md#execution-ownership The named unit validates existing pose/rig records without a renderer, anatomical asset or dynamic registration.
 */
export function test_validation_pose_joint_axis_finite(): void {
  const result: IAutoMovieValidation = validatePoseResult(
    makePose([joint("leftLowerArm", { flexion: Number.NaN })]),
    createSkeleton(),
  );

  TestValidator.equals("non-finite joint axis fails", result.success, false);
  TestValidator.predicate(
    "range violation on joint axis",
    hasViolation(result, "range", "$input.joints[0].flexion"),
  );
}
