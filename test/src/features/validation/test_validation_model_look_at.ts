import { compareCodeUnits, validateModel } from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieConstraintViolation,
  IAutoMovieLookAt,
  IAutoMovieModel,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel, createSkeleton } from "../internal/fixtures";

const WITHIN: IAutoMovieLookAt.IBone = {
  type: "bone",
  horizontalInner: 45,
  horizontalOuter: 45,
  verticalDown: 30,
  verticalUp: 30,
};

/**
 * Pins model admission of a gaze declaration and of axes a bone declares.
 *
 * The rig is the shared test skeleton plus two eye bones under its head, with
 * the default humanoid eye rows (flexion ±30, twist ±45) unless a scenario
 * overrides one. The ranges and axes are test inputs.
 *
 * Scenarios:
 *
 * 1. A bone gaze at exactly the eyes' reach is admitted, and an expression
 *    gaze needs no eyes.
 * 2. A bone gaze is refused on a model without a skeleton or without eyes,
 *    once per missing eye.
 * 3. A range beyond the reach is refused once per eye, and a negative or
 *    non-finite range once for itself.
 * 4. With the left eye's twist narrowed to −10..40, an outer range of 42 is
 *    refused on the left eye only, and an inner range of 12 also on the left
 *    eye only, since its outward turn is positive twist and the right eye's is
 *    negative.
 * 5. An unknown gaze type is refused.
 * 6. Orthogonal declared bone axes are admitted and skewed ones are refused at
 *    the bone's `axes` path.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs validateModel on models whose gaze and bone axes vary and asserts success or the exact violation kinds and paths; a missing eye check, a swapped per-eye direction, an off-by-boundary comparison or unchecked declared axes fails.
 * @evidence contracts/testing.md#independent-expectations Limits follow from the default eye row and the scenario's override read with the documented signs, positive twist toward the model's left and positive flexion down; the boundary values equal those limits.
 * @evidence contracts/testing.md#distinguishing-cases Covers the exact boundary, one degree over, negative and non-finite ranges, no skeleton and no eyes, the asymmetric per-eye override in both directions, the expression variant, an unknown type and valid against skewed axes; the eye-bone rotation itself belongs to the kinematics lookAt entry.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous validation unit entry over in-memory fixtures, calling engine source without a viewer, GPU or installed asset.
 */
export function test_validation_model_look_at(): void {
  // 1. admitted at the boundary; expression needs no eyes
  TestValidator.equals("bone gaze at the reach", issues(model(WITHIN)), []);
  TestValidator.equals(
    "expression gaze without eyes",
    issues({ ...createModel(), lookAt: { type: "expression" } }),
    [],
  );

  // 2. no skeleton, no eyes
  TestValidator.equals(
    "bone gaze without a skeleton",
    issues({ ...createModel(null), lookAt: WITHIN }),
    ["type $input.lookAt.type", "type $input.lookAt.type"],
  );
  TestValidator.equals(
    "bone gaze without eyes",
    issues({ ...createModel(), lookAt: WITHIN }),
    ["type $input.lookAt.type", "type $input.lookAt.type"],
  );

  // 3. beyond the reach, negative, non-finite
  TestValidator.equals(
    "one degree beyond the outward reach",
    issues(model({ ...WITHIN, horizontalOuter: 46 })),
    [
      "range $input.lookAt.horizontalOuter",
      "range $input.lookAt.horizontalOuter",
    ],
  );
  TestValidator.equals(
    "one degree beyond the downward reach",
    issues(model({ ...WITHIN, verticalDown: 31 })),
    ["range $input.lookAt.verticalDown", "range $input.lookAt.verticalDown"],
  );
  TestValidator.equals(
    "a negative and a non-finite range",
    issues(model({ ...WITHIN, verticalUp: -1, horizontalInner: Number.NaN })),
    ["range $input.lookAt.horizontalInner", "range $input.lookAt.verticalUp"],
  );

  // 4. an asymmetric left eye
  const narrowed: (lookAt: IAutoMovieLookAt) => IAutoMovieModel = (
    lookAt: IAutoMovieLookAt,
  ): IAutoMovieModel => {
    const base: IAutoMovieModel = model(lookAt);
    return {
      ...base,
      skeleton: {
        ...base.skeleton!,
        bones: base.skeleton!.bones.map(
          (bone: IAutoMovieBone): IAutoMovieBone =>
            bone.bone === "leftEye"
              ? {
                  ...bone,
                  constraint: {
                    flexion: { min: -30, max: 30 },
                    abduction: null,
                    twist: { min: -10, max: 40 },
                  },
                }
              : bone,
        ),
      },
    };
  };
  TestValidator.equals(
    "outer 42 exceeds only the left eye's positive twist",
    messages(narrowed({ ...WITHIN, horizontalOuter: 42, horizontalInner: 10 })),
    ["horizontalOuter turns leftEye 42 degrees, beyond the 40 degrees"],
  );
  TestValidator.equals(
    "inner 12 exceeds only the left eye's negative twist",
    messages(narrowed({ ...WITHIN, horizontalOuter: 40, horizontalInner: 12 })),
    ["horizontalInner turns leftEye 12 degrees, beyond the 10 degrees"],
  );

  // 5. unknown type
  TestValidator.equals(
    "unknown gaze type",
    issues(model({ type: "morph" } as unknown as IAutoMovieLookAt)),
    ["type $input.lookAt.type"],
  );

  // 6. declared bone axes
  const axed: (axes: IAutoMovieBone["axes"]) => IAutoMovieModel = (
    axes: IAutoMovieBone["axes"],
  ): IAutoMovieModel => {
    const base: IAutoMovieModel = createModel();
    return {
      ...base,
      skeleton: {
        ...base.skeleton!,
        bones: base.skeleton!.bones.map(
          (bone: IAutoMovieBone): IAutoMovieBone =>
            bone.bone === "leftLowerArm" ? { ...bone, axes } : bone,
        ),
      },
    };
  };
  TestValidator.equals(
    "orthogonal declared axes",
    issues(
      axed({
        flexion: { x: 0, y: 0, z: -1 },
        abduction: { x: 0, y: -1, z: 0 },
        twist: { x: 2, y: 0, z: 0 },
        twistPlacement: "distal",
      }),
    ),
    [],
  );
  TestValidator.equals(
    "skewed declared axes",
    issues(
      axed({
        flexion: { x: 1, y: 0, z: 0 },
        abduction: { x: 1, y: 1, z: 0 },
        twist: { x: 0, y: 0, z: 1 },
      }),
    ),
    ["range $input.skeleton.bones[6].axes.abduction"],
  );
}

/** The shared model with eyes under its head and `lookAt`. */
function model(lookAt: IAutoMovieLookAt): IAutoMovieModel {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const eye: (bone: "leftEye" | "rightEye", x: number) => IAutoMovieBone = (
    bone: "leftEye" | "rightEye",
    x: number,
  ): IAutoMovieBone => ({
    bone,
    parent: "head",
    rest: {
      translation: { x, y: 0.05, z: 0.08 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  return {
    ...createModel({
      ...skeleton,
      bones: [...skeleton.bones, eye("leftEye", 0.03), eye("rightEye", -0.03)],
    }),
    lookAt,
  };
}

/** Each violation as `kind path`, sorted. */
function issues(input: IAutoMovieModel): string[] {
  const result: IAutoMovieValidation = validateModel({ model: input });
  return result.success
    ? []
    : result.violations
        .map(
          (violation: IAutoMovieConstraintViolation): string =>
            `${violation.kind} ${violation.path}`,
        )
        .sort(compareCodeUnits);
}

/** Each violation message up to its last clause, sorted. */
function messages(input: IAutoMovieModel): string[] {
  const result: IAutoMovieValidation = validateModel({ model: input });
  return result.success
    ? []
    : result.violations
        .map((violation: IAutoMovieConstraintViolation): string =>
          violation.expected.replace(/ its range of motion.*$/, ""),
        )
        .sort(compareCodeUnits);
}
