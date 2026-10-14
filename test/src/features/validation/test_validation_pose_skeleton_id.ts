import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validatePoseResult } from "../../../../packages/engine/src/validation/validatePoseResult";
import { createSkeleton } from "../internal/createSkeleton";
import { createValidPose } from "../internal/createValidPose";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise pose skeleton identity against the supplied target rig.
 *
 * Scenarios:
 * 1. An otherwise supported conventional pose relabeled to another skeleton id fails with a type violation at skeleton.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validatePoseResult with only the pose rig identity changed and requires a skeleton type finding, catching acceptance of a pose targeting another rig.
 * @evidence contracts/testing.md#independent-expectations The pose and target must name the same skeleton; literal unequal identities determine refusal without reading pose evaluator output.
 * @evidence contracts/testing.md#distinguishing-cases Retains supported joints while changing only rig identity; pose_valid owns matching acceptance and pose_unknown_bone owns individual reference mismatches.
 * @evidence contracts/testing.md#execution-ownership This named unit uses the existing portable pose/rig factories with no Human model, host or dynamic registration.
 */
export function test_validation_pose_skeleton_id(): void {
  const result: IAutoMovieValidation = validatePoseResult(
    { ...createValidPose(), skeleton: "skeleton-2" },
    createSkeleton(),
  );
  TestValidator.equals("mismatched pose skeleton fails", result.success, false);
  TestValidator.predicate(
    "type violation on pose skeleton",
    hasViolation(result, "type", "$input.skeleton"),
  );
}
