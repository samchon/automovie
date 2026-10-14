import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateModel } from "../../../../packages/engine/src/validation/validateModel";
import { createModel } from "../internal/createModel";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise the minimum-part admission rule through model validation.
 *
 * Scenarios:
 * 1. The standard model with its parts emptied fails, with a type violation on parts.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel with an empty part population and requires refusal at the parts field, catching acceptance of an empty model.
 * @evidence contracts/testing.md#independent-expectations A renderable model requires at least one part; the expected refusal and owning address are literal admission requirements, not sampled output.
 * @evidence contracts/testing.md#distinguishing-cases Owns the empty population; model_valid supplies the nonempty admitted neighbor, while geometry and reference cases have separate entries.
 * @evidence contracts/testing.md#execution-ownership This named discoverable unit uses the portable validator and existing model factory without a renderer, loader or dynamic registration.
 */
export function test_validation_model_no_parts(): void {
  const result: IAutoMovieValidation = validateModel({
    model: { ...createModel(), parts: [] },
  });
  TestValidator.equals("empty model fails", result.success, false);
  TestValidator.predicate(
    "type violation on parts",
    hasViolation(result, "type", ".parts"),
  );
}
