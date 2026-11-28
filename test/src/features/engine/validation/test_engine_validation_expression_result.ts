import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../../internal/fixtures";
import { hasViolation } from "../../internal/predicates";

/**
 * `validateExpressionResult` admits a supported preset with unique channels
 * whose intensity and weights lie in [0, 1].
 *
 * Scenarios:
 *
 * 1. Happy at 0.8 with one jawOpen row at 0.3 succeeds.
 * 2. Happy at intensity 2 fails with a range finding on `.intensity`.
 * 3. JawOpen at weight 1.5 fails with a range finding on `.weight`.
 * 4. Two jawOpen rows (0.3 and 0.6) fail with a type finding on `.channel`, though
 *    both weights are valid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers one admitted expression and independent intensity, weight and duplicate-channel findings.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateExpressionResult with a supported preset and typed blendshape rows, mutating each tested condition independently.
 * @evidence contracts/development/testing.md#independent-expectations The valid intensity and weight lie in [0, 1], while two and 1.5 exceed it. Two jawOpen rows violate channel uniqueness despite their individually valid weights.
 */
export function test_engine_validation_expression_result(): void {
  const valid: IAutoMovieValidation = AutoMovieEngineValidation.validateExpressionResult(
    makeExpression("happy", 0.8, [{ channel: "jawOpen", weight: 0.3 }]),
  );
  TestValidator.equals("valid", valid.success, true);
  const intensity: IAutoMovieValidation = AutoMovieEngineValidation.validateExpressionResult(
    makeExpression("happy", 2),
  );
  TestValidator.equals("intensity fails", intensity.success, false);
  TestValidator.predicate(
    "intensity range",
    hasViolation(intensity, "range", ".intensity"),
  );
  const weight: IAutoMovieValidation = AutoMovieEngineValidation.validateExpressionResult(
    makeExpression("neutral", 0.5, [{ channel: "jawOpen", weight: 1.5 }]),
  );
  TestValidator.equals("weight fails", weight.success, false);
  TestValidator.predicate(
    "weight range",
    hasViolation(weight, "range", ".weight"),
  );
  const duplicate: IAutoMovieValidation = AutoMovieEngineValidation.validateExpressionResult(
    makeExpression("neutral", 0.5, [
      { channel: "jawOpen", weight: 0.3 },
      { channel: "jawOpen", weight: 0.6 },
    ]),
  );
  TestValidator.equals("duplicate fails", duplicate.success, false);
  TestValidator.predicate(
    "duplicate channel",
    hasViolation(duplicate, "type", ".channel"),
  );
}
