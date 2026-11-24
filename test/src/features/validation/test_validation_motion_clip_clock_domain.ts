import { validateMotion } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";
import { keyframe } from "../internal/keyframe";
import { makePose } from "../internal/makePose";

/**
 * The clip clock requires a finite positive duration and two ordered, in-range instants.
 *
 * Scenarios:
 * 1. Zero and one keys fail cardinality. The endpoints of a one-second interval pass.
 * 2. Invalid durations and non-finite, late or repeated instants identify their own field.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks admission and the returned temporal finding.
 * @evidence contracts/development/testing.md#independent-expectations Seconds and ordering are explicit input values.
 * @evidence contracts/development/testing.md#distinguishing-cases Each row violates a distinct clock predicate.
 * @evidence contracts/development/testing.md#execution-ownership Uses the public validator on in-memory records.
 * @evidence contracts/development/common.md#meaningful-documentation States both ends of the admitted interval.
 */
export function test_validation_motion_clip_clock_domain(): void {
  const motion: IAutoMovieMotion = createValidMotion();
  const skeleton = createSkeleton();
  const inspect = (duration: number, times: number[]): IAutoMovieValidation =>
    validateMotion({
      skeleton,
      motion: {
        ...motion,
        duration,
        keyframes: times.map((time) => keyframe(time, makePose([]))),
      },
    });
  TestValidator.equals(
    "both endpoints admitted",
    inspect(1, [0, 1]).success,
    true,
  );
  const cases: Array<[number, number[], string]> = [
    [1, [], "$input.keyframes"],
    [1, [0], "$input.keyframes"],
    [0, [0, 1], "$input.duration"],
    [1, [0, 2], "$input.keyframes[1].time"],
    [1, [0, 0.5, 0.5], "$input.keyframes[2].time"],
  ];
  for (const [duration, times, path] of cases) {
    const result = inspect(duration, times);
    TestValidator.predicate(
      `${duration} seconds with keys ${times} locates ${path}`,
      !result.success && hasViolation(result, "temporal", path),
    );
  }
}
