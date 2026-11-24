import { validateModel } from "@automovie/engine";
import {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Model admission rejects a material metallic coefficient beyond its unit
 * interval.
 *
 * Scenarios:
 *
 * 1. Metallic two fails with a range finding on metallic.
 */
export function test_unit_engine_validation_model_coeff_range(): void {
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    materials: base.materials.map(
      (m: IAutoMovieMaterial): IAutoMovieMaterial => ({ ...m, metallic: 2 }),
    ),
  };
  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("out-of-range metallic fails", result.success, false);
  TestValidator.predicate(
    "range violation on metallic",
    hasViolation(result, "range", ".metallic"),
  );
}
