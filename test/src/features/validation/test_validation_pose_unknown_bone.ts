import { validatePoseResult } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";

/**
 * Exercise joint-bone membership independently of matching pose/rig skeleton identities.
 *
 * Scenarios:
 * 1. A pose articulating jaw, which the existing rig lacks, fails with a type violation on bone.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validatePoseResult for an undeclared joint bone and requires its type finding, catching silent omission of a dangling joint reference.
 * @evidence contracts/testing.md#independent-expectations A pose can articulate only names declared by its supplied rig; the existing twelve-bone fixture contains no jaw, independently of validator indexing.
 * @evidence contracts/testing.md#distinguishing-cases Retains matching skeleton identities with one absent bone; pose_valid owns declared joints and pose_duplicate_bone owns repeated declared references.
 * @evidence contracts/testing.md#execution-ownership This named portable unit reuses the existing factories and constructs no jaw geometry, Human asset or host.
 */
export function test_validation_pose_unknown_bone(): void {
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
