import { computeRestHeight } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM, createSkeleton } from "../../internal/fixtures";
import { nclose, throwsError } from "../../internal/predicates";

/**
 * `computeRestHeight` is the rig's joint span. The fixture skeleton, with
 * identity rest rotations so world y is a running sum, has the head at y = 1 +
 * 0.2 + 0.2 + 0.2 + 0.1 = 1.7 and the left lower leg at y = 1 - 0.1 - 0.4 =
 * 0.5: a span of 1.2.
 *
 * Scenarios:
 *
 * 1. The fixture skeleton measures 1.2.
 * 2. A skeleton with no bones measures 0.
 * 3. Two hips bones are refused naming bones[1].bone and the first at
 *    bones[0].bone.
 * 4. A spine whose parent hips is absent is refused naming the missing bone.
 * 5. A hips and spine parent cycle is refused instead of recursing.
 */
export function test_engine_film_rest_height(): void {
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: IDENTITY_TRANSFORM,
    constraint: null,
  });
  const rig = (bones: IAutoMovieBone[]): IAutoMovieSkeleton => ({
    id: "bad-skeleton",
    bones,
  });
  TestValidator.predicate(
    "fixture",
    nclose(computeRestHeight(createSkeleton()), 1.2, 1e-12),
  );
  TestValidator.equals(
    "boneless",
    computeRestHeight({ id: "empty", bones: [] }),
    0,
  );
  TestValidator.predicate(
    "duplicate",
    throwsError(
      () => computeRestHeight(rig([bone("hips", null), bone("hips", null)])),
      [
        'skeleton "bad-skeleton" bone "hips" is duplicated at bones[1].bone; first declared at bones[0].bone',
      ],
    ),
  );
  TestValidator.predicate(
    "missing parent",
    throwsError(
      () => computeRestHeight(rig([bone("spine", "hips")])),
      ['skeleton "bad-skeleton" bone "hips" was not provided'],
    ),
  );
  TestValidator.predicate(
    "cycle",
    throwsError(
      () =>
        computeRestHeight(rig([bone("hips", "spine"), bone("spine", "hips")])),
      ['skeleton "bad-skeleton" bone parent cycle includes "hips"'],
    ),
  );
}
