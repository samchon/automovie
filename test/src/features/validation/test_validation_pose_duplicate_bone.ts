import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validatePoseResult } from "@automovie/engine";
import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";

/**
 * Exercise pose admission when two joint records compete for the same declared bone.
 *
 * Scenarios:
 * 1. A pose listing leftLowerArm twice at 30 and 60 degrees fails with a type violation on bone.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validatePoseResult and requires duplicate-bone refusal, catching silent acceptance or arbitrary resolution of competing joint records.
 * @evidence contracts/testing.md#independent-expectations A pose lists each bone at most once; equal literal bone identities violate uniqueness even though both angles satisfy the default elbow interval.
 * @evidence contracts/testing.md#distinguishing-cases Owns a duplicate declared bone with supported angles; pose_valid owns distinct joints and pose_unknown_bone owns an undeclared reference.
 * @evidence contracts/testing.md#execution-ownership This named unit uses portable pose admission and existing factories without constructing a Human figure or evaluating an FK pose.
 */
export function test_validation_pose_duplicate_bone(): void {
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
