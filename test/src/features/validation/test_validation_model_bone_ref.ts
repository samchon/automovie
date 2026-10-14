import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { IAutoMovieModel, IAutoMovieModelPart, IAutoMovieValidation } from "@automovie/interface";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Refuse a part attachment naming a bone absent from the model's declared rig.
 *
 * Scenarios:
 * 1. Attaching the existing part to undeclared jaw fails at attachedBone.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model validation with a dangling attachment and requires failed admission plus a type finding at the reference field, catching undeclared rigid-bone wiring.
 * @evidence contracts/testing.md#independent-expectations The existing fixture rig declares no jaw, so its part cannot resolve that name; literal type/path expectations follow reference admission rather than runtime attachment output.
 * @evidence contracts/testing.md#distinguishing-cases Owns one missing-bone reference; valid model, graph topology and rest-transform admission are separate model entries. This does not observe a built attachment or FK.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry reuses the existing model/rig fixture and invokes the portable validator without loading a Human asset, renderer or native artifact.
 */
export function test_validation_model_bone_ref(): void {
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map((p: IAutoMovieModelPart): IAutoMovieModelPart => ({ ...p, attachedBone: "jaw" })),
  };
  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("dangling bone fails", result.success, false);
  TestValidator.predicate(
    "type violation on attachedBone",
    hasViolation(result, "type", ".attachedBone"),
  );
}
