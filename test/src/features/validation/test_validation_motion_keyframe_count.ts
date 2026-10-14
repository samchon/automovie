import type { IAutoMovieSkeleton, IAutoMovieValidation } from "@automovie/interface";
import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise the minimum two-keyframe admission contract for a motion interval.
 *
 * Scenarios:
 *
 * 1. An empty keyframe list is a temporal validation failure.
 * 2. A single keyframe is also a temporal validation failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion for empty and singleton keyframe arrays, requiring temporal refusal at keyframes instead of accepting an interval with fewer than two keys.
 * @evidence contracts/testing.md#independent-expectations A motion clip declares an interpolated interval with at least two keys; literal cardinalities zero and one violate that requirement without using sampler output.
 * @evidence contracts/testing.md#distinguishing-cases Owns empty and singleton populations; motion_valid supplies a supported two-key neighbor and ordering/duration entries own timeline limits.
 * @evidence contracts/testing.md#execution-ownership The named unit uses the existing portable rig and keyframe factories; no sampler task, host or dynamic case registration runs.
 */
export function test_validation_motion_keyframe_count(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const empty: IAutoMovieValidation = validateMotion({
    motion: makeMotion([], 1),
    skeleton,
  });
  TestValidator.equals("empty keyframes fail", empty.success, false);
  TestValidator.predicate(
    "empty keyframes report temporal keyframes violation",
    hasViolation(empty, "temporal", "$input.keyframes"),
  );

  const single: IAutoMovieValidation = validateMotion({
    motion: makeMotion(
      [keyframe(0, makePose([joint("leftLowerArm", { flexion: 30 })]))],
      1,
    ),
    skeleton,
  });
  TestValidator.equals("single keyframe fails", single.success, false);
  TestValidator.predicate(
    "single keyframe reports temporal keyframes violation",
    hasViolation(single, "temporal", "$input.keyframes"),
  );
}
