import { computeRestHeight } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM, createSkeleton } from "../internal/fixtures";
import { nclose, throwsError } from "../internal/predicates";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls computeRestHeight for the existing rig, an empty skeleton and three malformed parent graphs, checking the measured scalar and named refusal messages, catching incorrect local-only height reduction or silently skipped malformed bones.
 * @evidence contracts/testing.md#independent-expectations Identity-rest offsets independently place the highest head joint at 1.7 and lowest lower-leg joint at 0.5, giving span 1.2; an empty population gives zero. Literal duplicate positions and missing/cyclic parent names determine the Error fragments without using computed rest frames as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves a nonempty multi-level rig and empty boundary plus existing duplicate, missing-parent and cycle cases; visible portable geometry extending beyond joints is measured by test_film_camera_subject_extent, and nonidentity rest rotations are outside this fixture.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_camera_rest_height entry owns its direct portable measurements and Error observations using the existing conventional rig, creating no new Human asset, installed consumer, native artifact or render host.
 */
export function test_film_camera_rest_height(): void {
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
