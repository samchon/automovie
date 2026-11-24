import { validateExpressionResult } from "@automovie/engine";
import { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Duplicate channel names conflict even when both weights are valid.
 *
 * Scenarios:
 *
 * 1. Two jawOpen rows with weights 0.3 and 0.6 fail with a channel type finding.
 */
export function test_unit_engine_validation_expression_duplicate_channel(): void {
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
