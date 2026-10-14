import { validateExpressionResult } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { IAutoMovieValidation } from "@automovie/interface";

import { makeExpression } from "../internal/fixtures";

/**
 * Admit a supported preset and unique supported channel whose magnitudes are in range.
 *
 * Scenarios:
 * 1. Happy at 0.8 with one jawOpen row at 0.3 succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual expression admission and requires success, catching an overbroad refusal of a supported preset/channel combination with interior magnitudes.
 * @evidence contracts/testing.md#independent-expectations Both names belong to their closed menus, both magnitudes lie in [0,1] and the sole channel is unique; no output snapshot supplies the expected verdict.
 * @evidence contracts/testing.md#distinguishing-cases Owns the accepted populated interior case; malformed names, repeated channels and upper scalar overflow have separate entries. This does not establish rendered expression quality or boundary admission.
 * @evidence contracts/testing.md#execution-ownership The named portable entry owns one fixture-produced document and observes actual engine validation without a face asset, host or native artifact.
 */
export function test_validation_expression_valid(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("happy", 0.8, [{ channel: "jawOpen", weight: 0.3 }]),
  );
  TestValidator.equals("valid expression succeeds", result.success, true);
}
