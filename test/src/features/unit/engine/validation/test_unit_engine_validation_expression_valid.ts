import { validateExpressionResult } from "@automovie/engine";
import { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../../../internal/fixtures";

/**
 * Admit a supported preset and unique supported channel whose magnitudes are in
 * range.
 *
 * Scenarios:
 *
 * 1. Happy at 0.8 with one jawOpen row at 0.3 succeeds.
 */
export function test_unit_engine_validation_expression_valid(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("happy", 0.8, [{ channel: "jawOpen", weight: 0.3 }]),
  );
  TestValidator.equals("valid expression succeeds", result.success, true);
}
