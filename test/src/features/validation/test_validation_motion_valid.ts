import { validateMotion } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";

/**
 * Exercise admission of the existing two-key, one-second elbow clip under the engine's default constraints.
 *
 * Scenarios:
 * 1. The standard two-keyframe elbow clip (0 to 120 degrees over one second) succeeds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateMotion and asserts success for the supported clip, catching a gate that always rejects motion.
 * @evidence contracts/development/testing.md#independent-expectations The authored keys at zero/one seconds are strictly increasing and within duration; elbow angles 0/120 satisfy the default interval and their 120-degree-per-second delta satisfies the speed policy.
 * @evidence contracts/development/testing.md#distinguishing-cases Supplies the admitted neighbor for motion identity, count, temporal and pose-refusal entries; easing accuracy and rendered movement remain outside its oracle.
 * @evidence contracts/development/testing.md#execution-ownership This named unit validates existing clip/rig records only, without Human model creation, animation sampling or a GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: The standard two-keyframe elbow clip (0 to 120 degrees over one second) succeeds.).
 */
export function test_validation_motion_valid(): void {
  const result: IAutoMovieValidation = validateMotion({
    motion: createValidMotion(),
    skeleton: createSkeleton(),
  });
  TestValidator.equals("valid motion succeeds", result.success, true);
}
