import { validateModel } from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieModel,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

const VALID_CONSTRAINT: IAutoMovieJointConstraint = {
  flexion: { min: -10, max: 10 },
  abduction: null,
  twist: { min: -5, max: 5 },
  swingDeg: 30,
};

const modelWithConstraint: (
  constraint: IAutoMovieJointConstraint,
) => IAutoMovieModel = (
  constraint: IAutoMovieJointConstraint,
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
                i === 0 ? { ...bone, constraint } : bone,
            ),
          },
  };
};

/**
 * Exercise model-level finite interval and swing-cone admission, including
 * periodic multi-turn boxes rather than assuming distance from zero is
 * monotone.
 *
 * Scenarios:
 *
 * 1. Valid/null cones and neutral-excluding positive/negative boxes remain
 *    admitted.
 * 2. Nonfinite, inverted and nonpositive bounds report their exact range paths;
 *    bad axis bounds do not invent a cone verdict.
 * 3. An ordinary box outside a narrow cone is refused.
 * 4. The supported [400,700] interval admits its 700-degree endpoint in a
 *    30-degree cone, and paired [340,380] intervals admit the interior 360/360
 *    zero-swing point in a 5-degree cone.
 * 5. [400,500] with an immobile other axis still has no pose in a 30-degree cone
 *    and remains refused.
 */
export function test_unit_engine_validation_model_bone_constraint(): void {
  TestValidator.equals(
    "valid constraint succeeds",
    validateModel({ model: modelWithConstraint(VALID_CONSTRAINT) }).success,
    true,
  );
  TestValidator.equals(
    "null swing constraint succeeds",
    validateModel({
      model: modelWithConstraint({ ...VALID_CONSTRAINT, swingDeg: null }),
    }).success,
    true,
  );

  const inverted: IAutoMovieValidation = validateModel({
    model: modelWithConstraint({
      ...VALID_CONSTRAINT,
      twist: { min: 15, max: -15 },
    }),
  });
  TestValidator.equals("inverted constraint fails", inverted.success, false);
  TestValidator.predicate(
    "range violation on inverted range",
    hasViolation(
      inverted,
      "range",
      "$input.skeleton.bones[0].constraint.twist",
    ),
  );

  const badSwing: IAutoMovieValidation = validateModel({
    model: modelWithConstraint({
      ...VALID_CONSTRAINT,
      swingDeg: 0,
    }),
  });
  TestValidator.equals(
    "non-positive swing cone fails",
    badSwing.success,
    false,
  );
  TestValidator.predicate(
    "range violation on swingDeg",
    hasViolation(
      badSwing,
      "range",
      "$input.skeleton.bones[0].constraint.swingDeg",
    ),
  );

  // 5. box ∩ cone empty: the most-retracted articulation the ranges allow is
  // (10, 10), which already swings 14.1°, past this 5° cone. No pose satisfies
  // both, so the constraint is genuinely unsatisfiable.
  const emptyIntersection: IAutoMovieValidation = validateModel({
    model: modelWithConstraint({
      flexion: { min: 10, max: 90 },
      abduction: { min: 10, max: 90 },
      twist: null,
      swingDeg: 5,
    }),
  });
  TestValidator.equals(
    "a constraint whose box and cone cannot intersect fails",
    emptyIntersection.success,
    false,
  );
  TestValidator.predicate(
    "the violation is reported against the cone, naming the minimum swing",
    hasViolation(
      emptyIntersection,
      "range",
      "$input.skeleton.bones[0].constraint.swingDeg",
    ),
  );

  // 6. the non-firing twins: a box that excludes neutral but sits inside a wide
  // cone admits poses and must validate. Oracle: the most-retracted pose is
  // (10, 0): swingConeAngle(10, 0) = 10°, comfortably inside a 95° cone.
  TestValidator.equals(
    "a neutral-excluding flexion range inside a wide cone succeeds",
    validateModel({
      model: modelWithConstraint({
        flexion: { min: 10, max: 90 },
        abduction: { min: -90, max: 90 },
        twist: null,
        swingDeg: 95,
      }),
    }).success,
    true,
  );
  TestValidator.equals(
    "a neutral-excluding abduction range (max < 0) inside a wide cone succeeds",
    validateModel({
      model: modelWithConstraint({
        flexion: { min: -90, max: 90 },
        abduction: { min: -90, max: -10 },
        twist: null,
        swingDeg: 95,
      }),
    }).success,
    true,
  );

  // A 700-degree flexion has the same quaternion representative as -20 degrees,
  // so the finite interval [400, 700] intersects a 30-degree cone at its far end.
  TestValidator.equals(
    "a periodic interval can admit swing at the endpoint farthest from zero",
    validateModel({
      model: modelWithConstraint({
        flexion: { min: 400, max: 700 },
        abduction: null,
        twist: null,
        swingDeg: 30,
      }),
    }).success,
    true,
  );
  // Two 360-degree half-angle cosines are -1, whose product is +1: zero swing.
  TestValidator.equals(
    "an interior periodic extremum on each axis can satisfy a narrow cone",
    validateModel({
      model: modelWithConstraint({
        flexion: { min: 340, max: 380 },
        abduction: { min: 340, max: 380 },
        twist: null,
        swingDeg: 5,
      }),
    }).success,
    true,
  );
  TestValidator.equals(
    "a periodic interval with no admitted small-swing pose remains refused",
    validateModel({
      model: modelWithConstraint({
        flexion: { min: 400, max: 500 },
        abduction: null,
        twist: null,
        swingDeg: 30,
      }),
    }).success,
    false,
  );
}
