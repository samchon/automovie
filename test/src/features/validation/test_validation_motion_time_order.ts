import type {
  IAutoMovieMotion,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";

/**
 * Exercise strict keyframe time ordering independently of finite in-duration bounds.
 *
 * Scenarios:
 * 1. A clip with keyframes at 0, 0.5 and again 0.5 seconds fails with a temporal time violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion with repeated adjacent times and requires a temporal time finding, catching admission of a zero-duration keyframe interval.
 * @evidence contracts/testing.md#independent-expectations Strict increase requires each next time to exceed its predecessor; 0.5 equals 0.5 and violates that independent ordering relation.
 * @evidence contracts/testing.md#distinguishing-cases Retains finite in-range values while violating equality; motion_valid owns strictly increasing keys and time_duration/non_finite_timing own other temporal domains.
 * @evidence contracts/testing.md#execution-ownership The named portable unit uses existing factories without sampling, scheduling or dynamically registering a case.
 */
export function test_validation_motion_time_order(): void {
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(0.5, makePose([joint("leftLowerArm", { flexion: 30 })])),
      keyframe(0.5, makePose([joint("leftLowerArm", { flexion: 60 })])),
    ],
    1,
  );
  const result: IAutoMovieValidation = validateMotion({
    motion,
    skeleton: createSkeleton(),
  });
  TestValidator.equals("non-increasing time fails", result.success, false);
  TestValidator.predicate(
    "temporal violation on time",
    hasViolation(result, "temporal", ".time"),
  );
}
