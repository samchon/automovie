import { validatePoseResult } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { hasViolation } from "../../../internal/hasViolation";
import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";

/**
 * Exercise pose admission when two joint records compete for the same declared
 * bone.
 *
 * Scenarios:
 *
 * 1. A pose listing leftLowerArm twice at 30 and 60 degrees fails with a type
 *    violation on bone.
 */
export function test_unit_engine_validation_pose_duplicate_bone(): void {
  const result: IAutoMovieValidation = validatePoseResult(
    makePose([
      joint("leftLowerArm", { flexion: 30 }),
      joint("leftLowerArm", { flexion: 60 }),
    ]),
    createSkeleton(),
  );
  TestValidator.equals("duplicate bone fails", result.success, false);
  TestValidator.predicate(
    "type violation on bone",
    hasViolation(result, "type", ".bone"),
  );
}
