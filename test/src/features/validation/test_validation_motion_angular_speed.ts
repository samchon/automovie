import type { IAutoMovieMotion, IAutoMovieValidation } from "@automovie/interface";
import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise the engine's declared 900-degree-per-second adjacent-axis speed policy; it is not a measured physiological maximum.
 *
 * Scenarios:
 * 1. A shoulder swinging from 0 to 170 degrees in 0.1 seconds (1700 degrees/second) fails with a temporal pose violation although both angles satisfy the default shoulder constraint.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion and requires a temporal pose finding for the fast shared shoulder, catching omission of adjacent-frame speed admission.
 * @evidence contracts/testing.md#independent-expectations The authored delta divided by elapsed seconds is 170/0.1=1700, above the declared 900 policy. This arithmetic certifies no sampled movement or anatomical maximum.
 * @evidence contracts/testing.md#distinguishing-cases Owns excessive shared-axis speed with individually admitted poses; motion_valid and motion_new_bone own slower movement and first-appearing joints, while time_order owns invalid elapsed time.
 * @evidence contracts/testing.md#execution-ownership The named portable unit validates existing rig/pose records without sampling motion, creating a Human figure or starting a renderer.
 */
export function test_validation_motion_angular_speed(): void {
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftUpperArm", { flexion: 0 })])),
      keyframe(0.1, makePose([joint("leftUpperArm", { flexion: 170 })])),
    ],
    0.1,
  );
  const result: IAutoMovieValidation = validateMotion({ motion, skeleton: createSkeleton() });
  TestValidator.equals("teleporting limb fails", result.success, false);
  TestValidator.predicate(
    "temporal violation on pose",
    hasViolation(result, "temporal", ".pose"),
  );
}
