import { validateModel } from "@automovie/engine";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Refuse a part's material id when it resolves to no material in its model.
 *
 * Scenarios:
 * 1. Changing the existing part's material to does-not-exist fails at material.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model validation with an unresolved material reference and requires failed admission plus its type finding, catching silent renderer fallback for dangling authoring ids.
 * @evidence contracts/testing.md#independent-expectations The existing fixture declares only mat-1, so does-not-exist cannot resolve; literal kind and material suffix independently specify the expected diagnostic owner.
 * @evidence contracts/testing.md#distinguishing-cases Owns missing material reference; valid model, duplicate ids and blank ids have separate entries. This does not observe material construction or native fallback behavior.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit copies existing fixture records and calls the portable engine validator without a loader, native artifact or renderer.
 */
export function test_validation_model_material_ref(): void {
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map(
      (p: IAutoMovieModelPart): IAutoMovieModelPart => ({
        ...p,
        material: "does-not-exist",
      }),
    ),
  };
  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("dangling material fails", result.success, false);
  TestValidator.predicate(
    "type violation on material",
    hasViolation(result, "type", ".material"),
  );
}
