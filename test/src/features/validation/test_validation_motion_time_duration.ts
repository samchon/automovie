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
 * Exercise the inclusive clip-duration bound for an otherwise increasing keyframe sequence.
 *
 * Scenarios:
 * 1. A one-second clip with a keyframe at two seconds fails with a temporal time violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion and requires refusal at time for a key beyond duration, catching omission of the upper time bound.
 * @evidence contracts/testing.md#independent-expectations Keyframe seconds must belong to [0,duration]; authored 2 exceeds 1 independently of interpolation or playback.
 * @evidence contracts/testing.md#distinguishing-cases Uses increasing finite times so the upper bound is the owned defect; motion_valid covers equality at the final duration and time_order owns repeated keys.
 * @evidence contracts/testing.md#execution-ownership This named unit uses existing rig/pose/clip factories and performs portable validation without a playback clock or dynamic registration.
 */
export function test_validation_motion_time_duration(): void {
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(2, makePose([joint("leftLowerArm", { flexion: 30 })])),
    ],
    1,
  );
  const result: IAutoMovieValidation = validateMotion({ motion, skeleton: createSkeleton() });
  TestValidator.equals("time past duration fails", result.success, false);
  TestValidator.predicate(
    "temporal violation on time",
    hasViolation(result, "temporal", ".time"),
  );
}
