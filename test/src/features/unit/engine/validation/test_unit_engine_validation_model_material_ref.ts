import { validateModel } from "@automovie/engine";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Refuse a part's material id when it resolves to no material in its model.
 *
 * Scenarios:
 *
 * 1. Changing the existing part's material to does-not-exist fails at material.
 */
export function test_unit_engine_validation_model_material_ref(): void {
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
