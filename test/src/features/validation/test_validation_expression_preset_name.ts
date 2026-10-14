import { validateExpressionResult } from "@automovie/engine";
import { AutoMovieExpressionPreset, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Reject a forged expression preset despite its valid intensity.
 *
 * Scenarios:
 * 1. Unknown confused at intensity 0.5 fails with a preset type finding.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual admission on a runtime-forged preset and requires failure at its preset field, catching a validator that assumes the compile-time union admitted JSON values.
 * @evidence contracts/testing.md#independent-expectations confused is outside the closed preset menu while intensity 0.5 is inside [0,1]; the expected type kind and preset suffix come from that authoring contract.
 * @evidence contracts/testing.md#distinguishing-cases Owns unknown-preset refusal without blendshapes; valid names, unknown/duplicate channels and numeric overflow have separate expression entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry uses the existing expression fixture and actual engine validator without starting a consumer, native build or renderer.
 */
export function test_validation_expression_preset_name(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("confused" as AutoMovieExpressionPreset, 0.5),
  );

  TestValidator.equals("unknown preset fails", result.success, false);
  TestValidator.predicate(
    "preset type violation",
    hasViolation(result, "type", ".preset"),
  );
}
