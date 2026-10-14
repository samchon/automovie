import { validateExpressionResult } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { IAutoMovieValidation } from "@automovie/interface";

import { makeExpression } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Refuse blendshape weight beyond the declared unit interval.
 *
 * Scenarios:
 * 1. JawOpen at weight 1.5 fails with a weight range finding.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual expression validation and requires failed admission plus a weight finding, catching excessive channel magnitudes that would otherwise reach morph consumers.
 * @evidence contracts/testing.md#independent-expectations Weight belongs to inclusive [0,1], so 1.5 is outside; supported neutral/jawOpen and in-range intensity isolate the channel magnitude fault.
 * @evidence contracts/testing.md#distinguishing-cases Owns upper channel-weight overflow; valid populated input, preset intensity overflow and name/uniqueness faults are separate entries. Negative, nonfinite and exact weight boundaries are not exercised here.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns one local expression and reads the engine report without a morph asset, renderer, process or native artifact.
 */
export function test_validation_expression_weight_range(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("neutral", 0.5, [{ channel: "jawOpen", weight: 1.5 }]),
  );
  TestValidator.equals("out-of-range weight fails", result.success, false);
  TestValidator.predicate(
    "range violation on weight",
    hasViolation(result, "range", ".weight"),
  );
}
