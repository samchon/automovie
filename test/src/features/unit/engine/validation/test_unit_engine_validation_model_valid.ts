import { validateModel } from "@automovie/engine";
import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/createModel";

/**
 * Exercise admission of the existing one-part generated model with its
 * connected rig and resolved material.
 *
 * Scenarios:
 *
 * 1. The standard one-part generated model (a box with a resolved material)
 *    succeeds.
 */
export function test_unit_engine_validation_model_valid(): void {
  const result: IAutoMovieValidation = validateModel({ model: createModel() });
  TestValidator.equals("valid model succeeds", result.success, true);
}
