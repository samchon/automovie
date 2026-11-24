import { validatePoseResult } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { createValidPose } from "../../../internal/createValidPose";
import { hasViolation } from "../../../internal/hasViolation";

/**
 * Exercise pose skeleton identity against the supplied target rig.
 *
 * Scenarios:
 *
 * 1. An otherwise supported conventional pose relabeled to another skeleton id
 *    fails with a type violation at skeleton.
 */
export function test_unit_engine_validation_pose_skeleton_id(): void {
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
