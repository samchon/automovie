import { validateExpressionResult } from "@automovie/engine";
import { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Refuse blendshape weight beyond the declared unit interval.
 *
 * Scenarios:
 *
 * 1. JawOpen at weight 1.5 fails with a weight range finding.
 */
export function test_unit_engine_validation_expression_weight_range(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("neutral", 0.5, [{ channel: "jawOpen", weight: 1.5 }]),
  );
  TestValidator.equals("out-of-range weight fails", result.success, false);
  TestValidator.predicate(
    "range violation on weight",
    hasViolation(result, "range", ".weight"),
  );
}
