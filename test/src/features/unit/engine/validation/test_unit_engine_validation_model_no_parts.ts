import { validateModel } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/createModel";
import { hasViolation } from "../../../internal/hasViolation";

/**
 * Exercise the minimum-part admission rule through model validation.
 *
 * Scenarios:
 *
 * 1. The standard model with its parts emptied fails, with a type violation on
 *    parts.
 */
export function test_unit_engine_validation_model_no_parts(): void {
  const result: IAutoMovieValidation = validateModel({
    model: { ...createModel(), parts: [] },
  });
  TestValidator.equals("empty model fails", result.success, false);
  TestValidator.predicate(
    "type violation on parts",
    hasViolation(result, "type", ".parts"),
  );
}
