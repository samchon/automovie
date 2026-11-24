import { validatePoseResult } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { hasViolation } from "../../../internal/hasViolation";
import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";

/**
 * Exercise joint-bone membership independently of matching pose/rig skeleton
 * identities.
 *
 * Scenarios:
 *
 * 1. A pose articulating jaw, which the existing rig lacks, fails with a type
 *    violation on bone.
 */
export function test_unit_engine_validation_pose_unknown_bone(): void {
  const result: IAutoMovieValidation = validatePoseResult(
    makePose([joint("jaw", { flexion: 10 })]),
    createSkeleton(),
  );
  TestValidator.equals("unknown bone fails", result.success, false);
  TestValidator.predicate(
    "type violation on bone",
    hasViolation(result, "type", ".bone"),
  );
}
