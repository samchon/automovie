import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validatePoseResult } from "../../../../packages/engine/src/validation/validatePoseResult";
import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";

/**
 * Exercise the engine's declared default elbow interval through whole-pose admission, without claiming a measured population-specific limit.
 *
 * Scenarios:
 * 1. Elbow flexion at 175 degrees exceeds the default 150-degree limit and fails with a rom violation on flexion.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validatePoseResult and requires a flexion rom finding, catching a pose gate that omits finite out-of-range joint admission.
 * @evidence contracts/testing.md#independent-expectations The default elbow domain is [0,150] degrees, and 175 exceeds its upper endpoint; this scalar comparison observes no physiological or visual truth.
 * @evidence contracts/testing.md#distinguishing-cases Owns finite excessive flexion; pose_joint_axis_finite owns NaN, pose_override admits the authored wider interval and pose_valid supplies ordinary acceptance.
 * @evidence contracts/testing.md#execution-ownership This named unit validates existing records through the portable pose wrapper, without creating a Human figure or GPU resource.
 */
export function test_validation_pose_rom(): void {
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
