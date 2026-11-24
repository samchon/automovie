import { validatePoseResult } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidPose } from "../internal/createValidPose";

/**
 * Exercise admission of the existing three-joint conventional pose under declared engine constraints.
 *
 * Scenarios:
 * 1. The existing shoulder, elbow and hip pose satisfies the target rig's default constraints and succeeds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validatePoseResult and asserts supported acceptance, catching unconditional refusal of the existing pose.
 * @evidence contracts/development/testing.md#independent-expectations The fixture names declared distinct bones with degree angles within default ranges and a supported combined hip swing; acceptance is scalar admission, not a clinical or visual posture oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Supplies the supported neighbor for pose identity, membership, duplicate, finite-axis and range cases; root TRS and authored overrides have separate entries.
 * @evidence contracts/development/testing.md#execution-ownership The named unit reuses the existing rig/pose records and evaluates portable validation without FK construction, Human assets or a GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: The existing shoulder, elbow and hip pose satisfies the target rig's default constraints and succeeds.).
 */
export function test_validation_pose_valid(): void {
  const result: IAutoMovieValidation = validatePoseResult(
    createValidPose(),
    createSkeleton(),
  );
  TestValidator.equals("valid pose succeeds", result.success, true);
}
