import { validatePoseResult } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { createValidPose } from "../../../internal/createValidPose";

/**
 * Exercise admission of the existing three-joint conventional pose under
 * declared engine constraints.
 *
 * Scenarios:
 *
 * 1. The existing shoulder, elbow and hip pose satisfies the target rig's default
 *    constraints and succeeds.
 */
export function test_unit_engine_validation_pose_valid(): void {
  const result: IAutoMovieValidation = validatePoseResult(
    createValidPose(),
    createSkeleton(),
  );
  TestValidator.equals("valid pose succeeds", result.success, true);
}
