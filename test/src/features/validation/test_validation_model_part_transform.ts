import type { IAutoMovieModel, IAutoMovieModelPart, IAutoMovieTransform, IAutoMovieValidation } from "@automovie/interface";
import { validateModel } from "../../../../packages/engine/src/validation/validateModel";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/createModel";
import { hasViolation } from "../internal/hasViolation";

const PART_TRANSFORM: IAutoMovieTransform = {
  translation: { x: 0.1, y: 0.2, z: 0.3 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

const modelWithPartTransform: (transform: IAutoMovieTransform) => IAutoMovieModel = (transform: IAutoMovieTransform) : IAutoMovieModel => {
  const base: IAutoMovieModel = createModel();
  return {
    ...base,
    parts: base.parts.map((part: IAutoMovieModelPart, i: number) : IAutoMovieModelPart =>
      i === 0 ? { ...part, transform } : part,
    ),
  };
};

/**
 * Exercise optional part-transform admission for finite translation, unit rotation and positive scale without normalizing authored values.
 *
 * Scenarios:
 *
 * 1. A valid non-null part transform still validates.
 * 2. Non-finite translation is a range violation.
 * 3. Non-finite rotation is a range violation.
 * 4. Finite but non-unit rotation is a range violation.
 * 5. Non-positive scale is a range violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel with one changed part transform, asserting valid acceptance and located refusals for nonfinite translation/rotation, non-unit rotation and zero scale.
 * @evidence contracts/testing.md#independent-expectations Finite components, unit quaternion norm and strictly positive scale define supported TRS; the identity rotation has norm one and w=2 has norm two independently of the validator.
 * @evidence contracts/testing.md#distinguishing-cases Retains the valid transform and all four fault families at the first part; null transforms and pose/bone transform ownership remain separate.
 * @evidence contracts/testing.md#execution-ownership This named unit validates existing model records with a local transform adapter; it creates no mesh, animation or renderer resource.
 */
export function test_validation_model_part_transform(): void {
  TestValidator.equals(
    "valid part transform succeeds",
    validateModel({ model: modelWithPartTransform(PART_TRANSFORM) }).success,
    true,
  );

  const badTranslation: IAutoMovieValidation = validateModel({
    model: modelWithPartTransform({
      ...PART_TRANSFORM,
      translation: { ...PART_TRANSFORM.translation, x: Number.NaN },
    }),
  });
  TestValidator.equals(
    "non-finite part translation fails",
    badTranslation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on part translation",
    hasViolation(
      badTranslation,
      "range",
      "$input.parts[0].transform.translation.x",
    ),
  );

  const badRotation: IAutoMovieValidation = validateModel({
    model: modelWithPartTransform({
      ...PART_TRANSFORM,
      rotation: { ...PART_TRANSFORM.rotation, w: Number.POSITIVE_INFINITY },
    }),
  });
  TestValidator.equals(
    "non-finite part rotation fails",
    badRotation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on part rotation",
    hasViolation(badRotation, "range", "$input.parts[0].transform.rotation.w"),
  );

  const nonUnitRotation: IAutoMovieValidation = validateModel({
    model: modelWithPartTransform({
      ...PART_TRANSFORM,
      rotation: { ...PART_TRANSFORM.rotation, w: 2 },
    }),
  });
  TestValidator.equals(
    "non-unit part rotation fails",
    nonUnitRotation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on part rotation length",
    hasViolation(
      nonUnitRotation,
      "range",
      "$input.parts[0].transform.rotation",
    ),
  );

  const badScale: IAutoMovieValidation = validateModel({
    model: modelWithPartTransform({
      ...PART_TRANSFORM,
      scale: { ...PART_TRANSFORM.scale, y: 0 },
    }),
  });
  TestValidator.equals(
    "non-positive part scale fails",
    badScale.success,
    false,
  );
  TestValidator.predicate(
    "range violation on part scale",
    hasViolation(badScale, "range", "$input.parts[0].transform.scale.y"),
  );
}
