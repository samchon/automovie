import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieMeshSkin,
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";
import { hasViolation } from "../internal/predicates";

/**
 * Model admission accepts the two skinning methods and their omission, refuses any other name, and refuses a dual-quaternion skin on a non-uniformly scaled part.
 *
 * Scenarios:
 * 1. The synthetic tube is admitted with the method omitted, `"linear"` and `"dual-quaternion"`.
 * 2. An unknown method name is a type violation at `skin.method`.
 * 3. A dual-quaternion skin on a part scaled (1, 2, 1) is a range violation at `transform.scale`, while a uniform (2, 2, 2) scale is admitted.
 * 4. A linear skin on the same non-uniform scale is admitted, and a non-uniformly scaled dual-quaternion part riding an `attachedBone` is admitted because the viewer draws it rigidly.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs validateModel over whole models and reads success and violation paths; catches an admitted unknown method, a refused valid method and a missing or over-broad scale gate.
 * @evidence contracts/testing.md#independent-expectations The interface's closed union names the two admitted methods, and the uniform-scale premise follows from dual quaternions representing only rigid transforms, so a scale differing per axis must be refused and an equal one admitted.
 * @evidence contracts/testing.md#distinguishing-cases Omitted, both valid and one unknown method; uniform and non-uniform scale under each method; and the attached-bone exception. Skinning arithmetic and the shader belong to the kinematics and viewer tests.
 * @evidence contracts/testing.md#execution-ownership A portable engine unit over a synthetic internal fixture; it starts no browser, GPU or process.
 */
export function test_validation_mesh_skin_method(): void {
  const modelWith: (
    method: IAutoMovieMeshSkin["method"] | "spline",
    scale?: IAutoMovieTransform["scale"],
  ) => IAutoMovieModel = (
    method: IAutoMovieMeshSkin["method"] | "spline",
    scale?: IAutoMovieTransform["scale"],
  ): IAutoMovieModel => {
    const model: IAutoMovieModel = createSkinnedTubeModel(
      method as IAutoMovieMeshSkin["method"],
    );
    if (scale !== undefined)
      model.parts[0]!.transform = {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale,
      };
    return model;
  };

  // 1. admitted methods
  for (const method of [undefined, "linear", "dual-quaternion"] as const)
    TestValidator.equals(
      `skin method ${String(method)} is admitted`,
      validateModel({ model: modelWith(method) }).success,
      true,
    );

  // 2. unknown method
  TestValidator.predicate(
    "an unknown skin method is refused",
    hasViolation(
      validateModel({ model: modelWith("spline") }),
      "type",
      "skin.method",
    ),
  );

  // 3. dual quaternion needs a uniform part scale
  const stretched: IAutoMovieTransform["scale"] = { x: 1, y: 2, z: 1 };
  TestValidator.predicate(
    "a non-uniformly scaled dual-quaternion part is refused",
    hasViolation(
      validateModel({ model: modelWith("dual-quaternion", stretched) }),
      "range",
      "parts[0].transform.scale",
    ),
  );
  TestValidator.equals(
    "a uniformly scaled dual-quaternion part is admitted",
    validateModel({
      model: modelWith("dual-quaternion", { x: 2, y: 2, z: 2 }),
    }).success,
    true,
  );

  // 4. the gate is specific to deforming dual-quaternion skins
  TestValidator.equals(
    "a non-uniformly scaled linear part is admitted",
    validateModel({ model: modelWith("linear", stretched) }).success,
    true,
  );
  const attached: IAutoMovieModel = modelWith("dual-quaternion", stretched);
  attached.parts[0]!.attachedBone = "spine";
  const validation: IAutoMovieValidation = validateModel({ model: attached });
  TestValidator.equals(
    "a rigidly attached dual-quaternion part is not scale-gated",
    validation.success,
    true,
  );
}
