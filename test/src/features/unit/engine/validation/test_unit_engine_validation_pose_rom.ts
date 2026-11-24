import { validatePoseResult } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { hasViolation } from "../../../internal/hasViolation";
import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";

/**
 * Exercise the engine's declared default elbow interval through whole-pose
 * admission, without claiming a measured population-specific limit.
 *
 * Scenarios:
 *
 * 1. Elbow flexion at 175 degrees exceeds the default 150-degree limit and fails
 *    with a rom violation on flexion.
 */
export function test_unit_engine_validation_pose_rom(): void {
  const result: IAutoMovieValidation = validatePoseResult(
    makePose([joint("leftLowerArm", { flexion: 175 })]),
    createSkeleton(),
  );
  TestValidator.equals("impossible pose fails", result.success, false);
  TestValidator.predicate(
    "rom violation on flexion",
    hasViolation(result, "rom", ".flexion"),
  );
}
