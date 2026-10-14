import { validateMotion } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise boolean loop admission without relying on JavaScript string truthiness.
 *
 * Scenarios:
 * 1. A forged string false is refused at loop.
 * 2. Boolean true remains supported.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion for string false and boolean true, requiring a located type refusal and supported looping acceptance.
 * @evidence contracts/testing.md#independent-expectations The loop field is boolean, and a string is not that type regardless of spelling; the expected result follows its declared domain rather than sampler output.
 * @evidence contracts/testing.md#distinguishing-cases Separates a truthy forged string from supported true; motion_valid owns supported false and temporal cases own duration/time domains.
 * @evidence contracts/testing.md#execution-ownership This named unit validates existing clip/rig records without playing a loop, creating a host or dynamically registering tests.
 */
export function test_validation_motion_loop_type(): void {
  const invalid: IAutoMovieMotion = {
    ...createValidMotion(),
    loop: "false" as unknown as boolean,
  };
  const rejected: IAutoMovieValidation = validateMotion({
    motion: invalid,
    skeleton: createSkeleton(),
  });
  TestValidator.equals("non-boolean loop fails", rejected.success, false);
  TestValidator.predicate(
    "loop type violation",
    hasViolation(rejected, "type", ".loop"),
  );

  const looping: IAutoMovieValidation = validateMotion({
    motion: { ...createValidMotion(), loop: true },
    skeleton: createSkeleton(),
  });
  TestValidator.equals("boolean true loop passes", looping.success, true);
}
