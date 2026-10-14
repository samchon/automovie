import type { IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateModel } from "@automovie/engine";
import { createModel } from "../internal/createModel";

/**
 * Exercise admission of a skeletonless generated object whose primitive part references an existing material and no bone.
 *
 * Scenarios:
 * 1. The standard valid model with its skeleton stripped to null validates successfully; its one primitive part attaches to no bone.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel with null skeleton and checks success, catching a validator that requires a rig for every object.
 * @evidence contracts/testing.md#independent-expectations The model contract permits null skeleton and unattached primitive parts; acceptance follows that optional-rig contract rather than a rendered snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Owns the null-rig neighbor of model_valid's rigged input; unresolved bone/material references and empty parts are covered separately.
 * @evidence contracts/testing.md#execution-ownership This named portable unit consumes the existing model record factory without loading an object, host or asset.
 */
export function test_validation_model_object(): void {
  const result: IAutoMovieValidation = validateModel({
    model: { ...createModel(), skeleton: null },
  });
  TestValidator.equals(
    "skeletonless object model is valid",
    result.success,
    true,
  );
}
