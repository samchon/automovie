import { validateExpressionResult } from "@automovie/engine";
import { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Refuse preset intensity beyond the declared unit interval.
 *
 * Scenarios:
 * 1. Happy at intensity two fails with a range finding on intensity.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual expression validation and requires failed admission plus a located intensity range fault, catching a validator that accepts an excessive preset magnitude.
 * @evidence contracts/testing.md#independent-expectations Intensity belongs to inclusive [0,1], so two is outside; happy is a supported name and no blendshape row supplies a competing failure.
 * @evidence contracts/testing.md#distinguishing-cases Owns upper intensity overflow; accepted preset/weight and channel-weight overflow are separate entries. Negative, nonfinite and exact intensity boundaries are not exercised here.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns one local expression and directly reads engine admission without a renderer, asset, process or native artifact.
 */
export function test_validation_expression_intensity_range(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("happy", 2),
  );
  TestValidator.equals("out-of-range intensity fails", result.success, false);
  TestValidator.predicate(
    "range violation on intensity",
    hasViolation(result, "range", ".intensity"),
  );
}
