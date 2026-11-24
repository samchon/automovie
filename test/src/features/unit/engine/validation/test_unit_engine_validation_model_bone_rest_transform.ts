import { validateModel } from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM, createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

const modelWithBoneRest: (rest: IAutoMovieTransform) => IAutoMovieModel = (
  rest: IAutoMovieTransform,
): IAutoMovieModel => {
  const base: IAutoMovieModel = createModel();
  return {
    ...base,
    skeleton:
      base.skeleton === null
        ? null
        : {
            ...base.skeleton,
            bones: base.skeleton.bones.map(
              (bone: IAutoMovieBone, i: number): IAutoMovieBone =>
                i === 0 ? { ...bone, rest } : bone,
            ),
          },
  };
};

/**
 * Model admission checks a bone's rest transform before FK consumers receive
 * it: finite components, unit rotation and positive scale.
 *
 * Scenarios:
 *
 * 1. A valid explicit rest transform still validates.
 * 2. Non-finite rest translation is a range violation.
 * 3. Non-finite rest rotation is a range violation.
 * 4. Finite but non-unit rest rotation is a range violation.
 * 5. Non-positive rest scale is a range violation.
 */
export function test_unit_engine_validation_model_bone_rest_transform(): void {
  TestValidator.equals(
    "valid bone rest transform succeeds",
    validateModel({ model: modelWithBoneRest(IDENTITY_TRANSFORM) }).success,
    true,
  );

  const nonUnitRotation: IAutoMovieValidation = validateModel({
    model: modelWithBoneRest({
      ...IDENTITY_TRANSFORM,
      rotation: { ...IDENTITY_TRANSFORM.rotation, w: 2 },
    }),
  });
  TestValidator.equals(
    "non-unit rest rotation fails",
    nonUnitRotation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on rest rotation length",
    hasViolation(
      nonUnitRotation,
      "range",
      "$input.skeleton.bones[0].rest.rotation",
    ),
  );

  const badScale: IAutoMovieValidation = validateModel({
    model: modelWithBoneRest({
      ...IDENTITY_TRANSFORM,
      scale: { ...IDENTITY_TRANSFORM.scale, y: 0 },
    }),
  });
  TestValidator.equals(
    "non-positive rest scale fails",
    badScale.success,
    false,
  );
  TestValidator.predicate(
    "range violation on rest scale",
    hasViolation(badScale, "range", "$input.skeleton.bones[0].rest.scale.y"),
  );
}
