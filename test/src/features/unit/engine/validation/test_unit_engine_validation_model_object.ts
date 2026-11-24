import { validateModel } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/createModel";

/**
 * Exercise admission of a skeletonless generated object whose primitive part
 * references an existing material and no bone.
 *
 * Scenarios:
 *
 * 1. The standard valid model with its skeleton stripped to null validates
 *    successfully; its one primitive part attaches to no bone.
 */
export function test_unit_engine_validation_model_object(): void {
  const result: IAutoMovieValidation = validateModel({
    model: { ...createModel(), skeleton: null },
  });
  TestValidator.equals(
    "skeletonless object model is valid",
    result.success,
    true,
  );
}
