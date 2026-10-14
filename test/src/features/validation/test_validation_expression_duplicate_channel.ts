import { validateExpressionResult } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { IAutoMovieValidation } from "@automovie/interface";

import { makeExpression } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Duplicate channel names conflict even when both weights are valid.
 *
 * Scenarios:
 * 1. Two jawOpen rows with weights 0.3 and 0.6 fail with a channel type finding.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual expression validation with a duplicate channel and requires failed admission plus its channel finding, catching silently selected or merged duplicate weights.
 * @evidence contracts/testing.md#independent-expectations One expression assigns each closed channel at most once; the two in-range weights isolate uniqueness from numeric admission. The expected kind and field follow that contract without copying a report.
 * @evidence contracts/testing.md#distinguishing-cases Owns repeated known-channel refusal; the adjacent unique-channel acceptance, unknown names and scalar limits have separate expression entries.
 * @evidence contracts/testing.md#execution-ownership The named portable entry owns this local document through the existing fixture, calls engine admission and starts no host or native build.
 */
export function test_validation_expression_duplicate_channel(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("neutral", 0.5, [
      { channel: "jawOpen", weight: 0.3 },
      { channel: "jawOpen", weight: 0.6 },
    ]),
  );
  TestValidator.equals("duplicate channel fails", result.success, false);
  TestValidator.predicate(
    "type violation on channel",
    hasViolation(result, "type", ".channel"),
  );
}
