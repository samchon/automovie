import { computeRestHeight } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM, createSkeleton } from "../../../internal/fixtures";
import { nclose, throwsError } from "../../../internal/predicates";

const bone: (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
): IAutoMovieBone => ({
  bone: name,
  parent,
  rest: IDENTITY_TRANSFORM,
  constraint: null,
});

const skeleton: (bones: IAutoMovieBone[]) => IAutoMovieSkeleton = (
  bones: IAutoMovieBone[],
): IAutoMovieSkeleton => ({
  id: "bad-skeleton",
  bones,
});

/**
 * Pins the rig's joint span, distinct from portable geometry height. The
 * shared fixture skeleton composes (identity rest rotations, so world Y is a
 * plain running sum) to head at y = 1 + 0.2 + 0.2 + 0.2 + 0.1 = 1.7 and the
 * left lower leg at y = 1 − 0.1 − 0.4 = 0.5: a hand-computed extent of 1.2.
 *
 * Scenarios:
 *
 * 1. `createSkeleton()` → height 1.2 (oracle above, not the code's echo).
 * 2. A skeleton with no bones → 0 (the caller substitutes the default subject
 *    height).
 * 3. A duplicate hips bone refuses with both source indices.
 * 4. A spine referencing an absent hips parent refuses that missing bone.
 * 5. A hips/spine parent cycle refuses instead of recursing indefinitely.
 */
export function test_unit_engine_film_film_camera_rest_height(): void {
  TestValidator.predicate(
    "fixture skeleton measures 1.2 m",
    nclose(computeRestHeight(createSkeleton()), 1.2),
  );
  TestValidator.predicate(
    "boneless skeleton measures 0",
    nclose(computeRestHeight({ id: "empty", bones: [] }), 0),
  );
  TestValidator.predicate(
    "duplicate rest-height bone rejects malformed skeleton",
    throwsError(
      (): number =>
        computeRestHeight(skeleton([bone("hips", null), bone("hips", null)])),
      'skeleton "bad-skeleton" bone "hips" is duplicated at bones[1].bone; first declared at bones[0].bone',
    ),
  );
  TestValidator.predicate(
    "missing rest-height parent rejects malformed skeleton",
    throwsError(
      (): number => computeRestHeight(skeleton([bone("spine", "hips")])),
      'skeleton "bad-skeleton" bone "hips" was not provided',
    ),
  );
  TestValidator.predicate(
    "rest-height parent cycle rejects malformed skeleton",
    throwsError(
      (): number =>
        computeRestHeight(
          skeleton([bone("hips", "spine"), bone("spine", "hips")]),
        ),
      'skeleton "bad-skeleton" bone parent cycle includes "hips"',
    ),
  );
}
