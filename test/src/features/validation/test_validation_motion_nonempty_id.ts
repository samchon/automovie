import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise nonblank motion identity admission independently of valid clip timing and poses.
 *
 * Scenarios:
 * 1. An otherwise valid clip with a whitespace-only id fails at $input.id.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion with a whitespace identity and requires its type refusal, catching acceptance of an unusable stable reference.
 * @evidence contracts/testing.md#independent-expectations Motion identities require non-whitespace content; the supplied single space and literal id path determine refusal independently of export behavior.
 * @evidence contracts/testing.md#distinguishing-cases Changes only the identity of an otherwise supported clip; motion_valid owns nonblank acceptance and skeleton identity has separate tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit uses the existing clip and rig factories without export, host startup or dynamically registered cases.
 */
export function test_validation_motion_nonempty_id(): void {
  const result: IAutoMovieValidation = validateMotion({
    motion: { ...createValidMotion(), id: " " },
    skeleton: createSkeleton(),
  });

  TestValidator.equals("blank motion id fails", result.success, false);
  TestValidator.predicate(
    "type violation on motion id",
    hasViolation(result, "type", "$input.id"),
  );
}
