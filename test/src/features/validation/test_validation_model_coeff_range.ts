import { validateModel } from "@automovie/engine";
import {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Model admission rejects a material metallic coefficient beyond its unit interval.
 *
 * Scenarios:
 * 1. Metallic two fails with a range finding on metallic.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model admission after changing the existing material's metallic coefficient and checks failed admission plus its field finding, catching a missing numeric gate.
 * @evidence contracts/testing.md#independent-expectations Metallic belongs to inclusive [0,1], so two is outside; expected kind and suffix are authored contract facts rather than a snapshot of shader or validator output.
 * @evidence contracts/testing.md#distinguishing-cases Owns upper metallic overflow; valid material input, nonfinite scalar admission and other material families have separate entries. This case does not cover every coefficient or rendered PBR response.
 * @evidence contracts/testing.md#execution-ownership The named portable unit owns one modified existing-fixture model and reads actual engine validation without a renderer, process or native artifact.
 */
export function test_validation_model_coeff_range(): void {
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
