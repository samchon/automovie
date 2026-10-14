import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateModel } from "../../../../packages/engine/src/validation/validateModel";
import { createModel } from "../internal/createModel";

/**
 * Exercise admission of the existing one-part generated model with its connected rig and resolved material.
 *
 * Scenarios:
 * 1. The standard one-part generated model (a box with a resolved material) succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel and asserts success, catching unconditional refusal of the existing supported model.
 * @evidence contracts/testing.md#independent-expectations The fixture has one positive-sized box, a declared material, nonblank identities and a connected twelve-bone rig; those authored properties satisfy the admission contract without reading a validator verdict first.
 * @evidence contracts/testing.md#distinguishing-cases Supplies the supported neighbor for the model failure entries; it does not claim exhaustive primitive, mesh, material or anatomy coverage.
 * @evidence contracts/testing.md#execution-ownership This named portable unit uses the existing model factory and validates records only, with no Human asset, host or GPU execution.
 */
export function test_validation_model_valid(): void {
  const result: IAutoMovieValidation = validateModel({ model: createModel() });
  TestValidator.equals("valid model succeeds", result.success, true);
}
