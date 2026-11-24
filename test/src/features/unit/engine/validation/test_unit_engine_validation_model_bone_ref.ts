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
 * Refuse a part attachment naming a bone absent from the model's declared rig.
 *
 * Scenarios:
 *
 * 1. Attaching the existing part to undeclared jaw fails at attachedBone.
 */
export function test_unit_engine_validation_model_bone_ref(): void {
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map(
      (p: IAutoMovieModelPart): IAutoMovieModelPart => ({
        ...p,
        attachedBone: "jaw",
      }),
    ),
  };
  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("dangling bone fails", result.success, false);
  TestValidator.predicate(
    "type violation on attachedBone",
    hasViolation(result, "type", ".attachedBone"),
  );
}
