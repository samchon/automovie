import { validateModel } from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

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
 * Model admission checks a bone's rest transform before FK consumers receive it: finite components, unit rotation and positive scale.
 *
 * Scenarios:
 *
 * 1. A valid explicit rest transform still validates.
 * 2. Non-finite rest translation is a range violation.
 * 3. Non-finite rest rotation is a range violation.
 * 4. Finite but non-unit rest rotation is a range violation.
 * 5. Non-positive rest scale is a range violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls model validation with a valid rest transform and four malformed variants, requiring failure and exact component or norm addresses so bad rest metadata cannot silently seed FK.
 * @evidence contracts/testing.md#independent-expectations Identity TRS is valid, NaN/infinity are not finite, quaternion [0,0,0,2] has norm two and zero scale is not positive. Literal paths distinguish scalar faults from the quaternion's joint norm rule.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts accepted identity, nonfinite translation/rotation, finite nonunit rotation and collapsed scale; graph reachability and part/root transforms have separate entries. No rendered rig or all-axis exhaustive claim follows from these samples.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns record copies of the existing model/rig fixture and invokes portable admission without a Human asset, FK host, renderer or native artifact.
 */
export function test_validation_model_bone_rest_transform(): void {
  TestValidator.equals(
    "valid bone rest transform succeeds",
    validateModel({ model: modelWithBoneRest(IDENTITY_TRANSFORM) }).success,
    true,
  );

  const badTranslation: IAutoMovieValidation = validateModel({
    model: modelWithBoneRest({
      ...IDENTITY_TRANSFORM,
      translation: { ...IDENTITY_TRANSFORM.translation, x: Number.NaN },
    }),
  });
  TestValidator.equals(
    "non-finite rest translation fails",
    badTranslation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on rest translation",
    hasViolation(
      badTranslation,
      "range",
      "$input.skeleton.bones[0].rest.translation.x",
    ),
  );

  const badRotation: IAutoMovieValidation = validateModel({
    model: modelWithBoneRest({
      ...IDENTITY_TRANSFORM,
      rotation: { ...IDENTITY_TRANSFORM.rotation, w: Number.POSITIVE_INFINITY },
    }),
  });
  TestValidator.equals(
    "non-finite rest rotation fails",
    badRotation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on rest rotation",
    hasViolation(
      badRotation,
      "range",
      "$input.skeleton.bones[0].rest.rotation.w",
    ),
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
