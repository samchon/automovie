import { validateMotion } from "@automovie/engine";
import type { IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";

/**
 * Rig selection is validated at the clip envelope.
 *
 * Scenarios:
 * 1. Either boolean repetition value admits the authored elbow movement.
 * 2. A different rig identifies the failing field.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Observes public validation and exact field findings.
 * @evidence contracts/development/testing.md#independent-expectations The rig has a known id and repetition accepts booleans.
 * @evidence contracts/development/testing.md#distinguishing-cases Changes one field against the same admitted clip.
 * @evidence contracts/development/testing.md#execution-ownership Uses a single in-memory rig.
 * @evidence contracts/development/common.md#meaningful-documentation Lists accepted neighbors and independent refusals.
 */
export function test_validation_motion_clip_identity(): void {
  const motion = createValidMotion();
  const skeleton = createSkeleton();
  for (const loop of [true, false])
    TestValidator.equals(
      `loop ${loop} admitted`,
      validateMotion({ skeleton, motion: { ...motion, loop } }).success,
      true,
    );
  const cases: Array<[Partial<IAutoMovieMotion>, string]> = [
    [{ skeleton: skeleton.id + "-other" }, "$input.skeleton"],
  ];
  for (const [change, path] of cases) {
    const result = validateMotion({
      skeleton,
      motion: { ...motion, ...change },
    });
    TestValidator.predicate(
      path,
      !result.success && hasViolation(result, "type", path),
    );
  }
}
