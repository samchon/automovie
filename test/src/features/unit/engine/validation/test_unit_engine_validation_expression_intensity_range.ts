import { validateExpressionResult } from "@automovie/engine";
import { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Refuse preset intensity beyond the declared unit interval.
 *
 * Scenarios:
 *
 * 1. Happy at intensity two fails with a range finding on intensity.
 */
export function test_unit_engine_validation_expression_intensity_range(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("happy", 2),
  );
  TestValidator.equals("out-of-range intensity fails", result.success, false);
  TestValidator.predicate(
    "range violation on intensity",
    hasViolation(result, "range", ".intensity"),
  );
}
